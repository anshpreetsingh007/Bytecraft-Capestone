"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimit = void 0;
exports.rateLimit = rateLimit;
const errors_1 = require("./errors");
function rateLimit(options = {}) {
    const { windowMs = 60_000, max = 120 } = options;
    const windows = new Map();
    let lastSweep = Date.now();
    const defaultKey = (req) => {
        if (req.actor?.kind === 'user')
            return `user:${req.actor.uid}`;
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
                if (window.resetAt <= now)
                    windows.delete(key);
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
            next((0, errors_1.tooManyRequests)(`Too many requests. Try again in ${retryAfter} seconds.`));
            return;
        }
        res.setHeader('x-ratelimit-remaining', String(max - existing.count));
        next();
    };
}
/** Tighter budget for endpoints that write, or that touch account state. */
const strictRateLimit = () => rateLimit({ windowMs: 60_000, max: 30 });
exports.strictRateLimit = strictRateLimit;
