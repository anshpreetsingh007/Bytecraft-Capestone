/**
 * A small fixed-window rate limiter.
 *
 * Only the chatbot was rate limited, which left the auth and submission
 * endpoints open to being hammered. This is deliberately in-process: with one
 * replica per service it is exactly right, and with several it still cuts the
 * ceiling down by a useful factor. Swap in Redis if the deployment ever grows
 * past that.
 */
import type { Request, RequestHandler } from 'express';
import { tooManyRequests } from './errors';

interface Window {
    count: number;
    resetAt: number;
}

export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    /** Defaults to the authenticated user, falling back to the client IP. */
    keyFor?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
    const { windowMs = 60_000, max = 120 } = options;
    const windows = new Map<string, Window>();
    let lastSweep = Date.now();

    const defaultKey = (req: Request): string => {
        if (req.actor?.kind === 'user') return `user:${req.actor.uid}`;
        const forwarded = req.header('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;
        return `ip:${ip ?? 'unknown'}`;
    };

    const keyFor = options.keyFor ?? defaultKey;

    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();

        // Sweeping on a timer would keep the event loop alive and block a
        // graceful shutdown, so expired windows are dropped opportunistically.
        if (now - lastSweep > windowMs) {
            for (const [key, window] of windows) {
                if (window.resetAt <= now) windows.delete(key);
            }
            lastSweep = now;
        }

        const key = keyFor(req);
        const existing = windows.get(key);

        if (!existing || existing.resetAt <= now) {
            windows.set(key, { count: 1, resetAt: now + windowMs });
            res.setHeader('x-ratelimit-remaining', String(max - 1));
            next();
            return;
        }

        existing.count += 1;

        if (existing.count > max) {
            const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
            res.setHeader('retry-after', String(retryAfter));
            res.setHeader('x-ratelimit-remaining', '0');
            next(tooManyRequests(`Too many requests. Try again in ${retryAfter} seconds.`));
            return;
        }

        res.setHeader('x-ratelimit-remaining', String(max - existing.count));
        next();
    };
}

/** Tighter budget for endpoints that write, or that touch account state. */
export const strictRateLimit = () => rateLimit({ windowMs: 60_000, max: 30 });
