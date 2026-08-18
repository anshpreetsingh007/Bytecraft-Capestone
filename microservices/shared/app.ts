/**
 * Service bootstrap.
 *
 * Every service used to hand-roll this and they had drifted apart: some had a
 * pool error handler, some did not; all of them called `app.use(cors())`,
 * which allows every origin on the internet to make credentialed requests.
 */
import express, { type Express } from 'express';
import cors from 'cors';
import type { DatabasePool } from './db';
import { configureAuth } from './auth';
import { errorHandler, notFoundHandler } from './errors';
import { logger, requestContext, setServiceName } from './logger';
import { rateLimit } from './rateLimit';

export interface ServiceOptions {
    serviceName: string;
    pool?: DatabasePool;
    /** Requests per minute per caller, across the whole service. */
    rateLimitMax?: number;
    jsonLimit?: string;
}

/**
 * Origins allowed to call the API with credentials. In this deployment the
 * only browser-facing origin is the Next.js app, which proxies to the
 * services -- the services themselves are not meant to be reachable from a
 * browser at all once the published ports are removed.
 */
function allowedOrigins(): string[] {
    const configured = process.env.ALLOWED_ORIGINS;
    if (configured) {
        return configured
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

export function createServiceApp(options: ServiceOptions): Express {
    const { serviceName, pool, rateLimitMax = 300, jsonLimit = '1mb' } = options;

    setServiceName(serviceName);
    process.env.SERVICE_NAME ??= serviceName;

    if (pool) {
        configureAuth(pool);
        pool.on('error', (error) => {
            // A dropped idle connection is normal and pg will reconnect. The
            // previous handler called process.exit(-1) here, which turned a
            // routine network hiccup into an outage.
            logger.error('idle database client error', { err: error });
        });
    }

    const app = express();

    // Behind the Next.js rewrite proxy (and an ingress in k8s), so the client
    // IP arrives in x-forwarded-for.
    app.set('trust proxy', 1);
    app.disable('x-powered-by');

    const origins = allowedOrigins();
    app.use(
        cors({
            origin(origin, callback) {
                // Server-to-server calls send no Origin header at all.
                if (!origin || origins.includes(origin)) {
                    callback(null, true);
                    return;
                }
                callback(null, false);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-internal-token', 'x-calling-service'],
            exposedHeaders: ['x-request-id'],
            maxAge: 600,
        }),
    );

    // requestContext first, so a body-parser failure still gets a request id
    // and still appears in the logs like any other request.
    app.use(requestContext(serviceName));
    app.use(express.json({ limit: jsonLimit }));
    app.use(rateLimit({ max: rateLimitMax }));

    // Liveness: is the process up. Deliberately does not touch the database,
    // so a database blip does not get every pod restarted.
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: serviceName });
    });

    // Readiness: can this instance actually serve traffic right now.
    app.get('/ready', (_req, res) => {
        if (!pool) {
            res.json({ status: 'ready', service: serviceName });
            return;
        }
        pool
            .query('SELECT 1')
            .then(() => res.json({ status: 'ready', service: serviceName }))
            .catch((error) => {
                logger.warn('readiness probe failed', { err: error });
                res.status(503).json({ status: 'not-ready', service: serviceName });
            });
    });

    return app;
}

/** Mount after all routes. Order matters: 404 first, then the error handler. */
export function finalizeServiceApp(app: Express): void {
    app.use(notFoundHandler);
    app.use(errorHandler);
}

export interface StartOptions {
    serviceName: string;
    port: number;
    pool?: DatabasePool;
}

/**
 * Starts listening and shuts down cleanly.
 *
 * Without this, a rolling deploy sends SIGTERM, Node exits immediately, and
 * every request in flight is dropped. Kubernetes assumes the process drains
 * itself; nothing else will do it.
 */
export function startService(app: Express, options: StartOptions): void {
    const { serviceName, port, pool } = options;

    const server = app.listen(port, () => {
        logger.info('service started', { port, nodeEnv: process.env.NODE_ENV ?? 'development' });
    });

    // Slightly above a typical 60s load-balancer idle timeout, so the balancer
    // closes connections first rather than us closing one mid-response.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 70_000;

    let shuttingDown = false;

    const shutdown = (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info('shutdown requested', { signal });

        const forceExit = setTimeout(() => {
            logger.error('graceful shutdown timed out, exiting anyway');
            process.exit(1);
        }, 15_000);
        forceExit.unref();

        server.close(async (error) => {
            if (error) logger.error('error while closing the http server', { err: error });
            try {
                await pool?.end();
            } catch (poolError) {
                logger.error('error while closing the database pool', { err: poolError });
            }
            clearTimeout(forceExit);
            logger.info('shutdown complete');
            process.exit(error ? 1 : 0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
        logger.error('unhandled promise rejection', { err: reason });
    });

    process.on('uncaughtException', (error) => {
        logger.error('uncaught exception, shutting down', { err: error });
        shutdown('uncaughtException');
    });
}
