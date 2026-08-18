"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceApp = createServiceApp;
exports.finalizeServiceApp = finalizeServiceApp;
exports.startService = startService;
/**
 * Service bootstrap.
 *
 * Every service used to hand-roll this and they had drifted apart: some had a
 * pool error handler, some did not; all of them called `app.use(cors())`,
 * which allows every origin on the internet to make credentialed requests.
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./auth");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const rateLimit_1 = require("./rateLimit");
/**
 * Origins allowed to call the API with credentials. In this deployment the
 * only browser-facing origin is the Next.js app, which proxies to the
 * services -- the services themselves are not meant to be reachable from a
 * browser at all once the published ports are removed.
 */
function allowedOrigins() {
    const configured = process.env.ALLOWED_ORIGINS;
    if (configured) {
        return configured
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}
function createServiceApp(options) {
    const { serviceName, pool, rateLimitMax = 300, jsonLimit = '1mb' } = options;
    (0, logger_1.setServiceName)(serviceName);
    process.env.SERVICE_NAME ??= serviceName;
    if (pool) {
        (0, auth_1.configureAuth)(pool);
        pool.on('error', (error) => {
            // A dropped idle connection is normal and pg will reconnect. The
            // previous handler called process.exit(-1) here, which turned a
            // routine network hiccup into an outage.
            logger_1.logger.error('idle database client error', { err: error });
        });
    }
    const app = (0, express_1.default)();
    // Behind the Next.js rewrite proxy (and an ingress in k8s), so the client
    // IP arrives in x-forwarded-for.
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    const origins = allowedOrigins();
    app.use((0, cors_1.default)({
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
    }));
    app.use(express_1.default.json({ limit: jsonLimit }));
    app.use((0, logger_1.requestContext)(serviceName));
    app.use((0, rateLimit_1.rateLimit)({ max: rateLimitMax }));
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
            logger_1.logger.warn('readiness probe failed', { err: error });
            res.status(503).json({ status: 'not-ready', service: serviceName });
        });
    });
    return app;
}
/** Mount after all routes. Order matters: 404 first, then the error handler. */
function finalizeServiceApp(app) {
    app.use(errors_1.notFoundHandler);
    app.use(errors_1.errorHandler);
}
/**
 * Starts listening and shuts down cleanly.
 *
 * Without this, a rolling deploy sends SIGTERM, Node exits immediately, and
 * every request in flight is dropped. Kubernetes assumes the process drains
 * itself; nothing else will do it.
 */
function startService(app, options) {
    const { serviceName, port, pool } = options;
    const server = app.listen(port, () => {
        logger_1.logger.info('service started', { port, nodeEnv: process.env.NODE_ENV ?? 'development' });
    });
    // Slightly above a typical 60s load-balancer idle timeout, so the balancer
    // closes connections first rather than us closing one mid-response.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 70_000;
    let shuttingDown = false;
    const shutdown = (signal) => {
        if (shuttingDown)
            return;
        shuttingDown = true;
        logger_1.logger.info('shutdown requested', { signal });
        const forceExit = setTimeout(() => {
            logger_1.logger.error('graceful shutdown timed out, exiting anyway');
            process.exit(1);
        }, 15_000);
        forceExit.unref();
        server.close(async (error) => {
            if (error)
                logger_1.logger.error('error while closing the http server', { err: error });
            try {
                await pool?.end();
            }
            catch (poolError) {
                logger_1.logger.error('error while closing the database pool', { err: poolError });
            }
            clearTimeout(forceExit);
            logger_1.logger.info('shutdown complete');
            process.exit(error ? 1 : 0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('unhandled promise rejection', { err: reason });
    });
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('uncaught exception, shutting down', { err: error });
        shutdown('uncaughtException');
    });
}
