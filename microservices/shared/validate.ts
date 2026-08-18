/**
 * Request validation.
 *
 * Every helper either returns a correctly typed value or throws a 400 through
 * AppError. Nothing reaches a SQL query without passing through here, which is
 * what stops a stray `parseInt(undefined)` becoming `NaN` in a WHERE clause.
 */
import type { Request } from 'express';
import { badRequest } from './errors';

export function requireString(
    value: unknown,
    field: string,
    options: { min?: number; max?: number; pattern?: RegExp } = {},
): string {
    if (typeof value !== 'string') throw badRequest(`${field} must be text`);
    const trimmed = value.trim();
    const { min = 1, max = 1000, pattern } = options;

    if (trimmed.length < min) {
        throw badRequest(min === 1 ? `${field} is required` : `${field} must be at least ${min} characters`);
    }
    if (trimmed.length > max) throw badRequest(`${field} must be ${max} characters or fewer`);
    if (pattern && !pattern.test(trimmed)) throw badRequest(`${field} is not in the expected format`);
    return trimmed;
}

export function optionalString(
    value: unknown,
    field: string,
    options: { max?: number; pattern?: RegExp } = {},
): string | null {
    if (value === undefined || value === null || value === '') return null;
    return requireString(value, field, { min: 1, ...options });
}

export function requireInt(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number {
    const { min = 1, max = Number.MAX_SAFE_INTEGER } = options;
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());

    if (!Number.isInteger(parsed)) throw badRequest(`${field} must be a whole number`);
    if (parsed < min || parsed > max) throw badRequest(`${field} must be between ${min} and ${max}`);
    return parsed;
}

export function optionalInt(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number | null {
    if (value === undefined || value === null || value === '') return null;
    return requireInt(value, field, options);
}

export function requireNumber(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number {
    const { min = 0, max = Number.MAX_SAFE_INTEGER } = options;
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());

    if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number`);
    if (parsed < min || parsed > max) throw badRequest(`${field} must be between ${min} and ${max}`);
    return parsed;
}

export function optionalNumber(
    value: unknown,
    field: string,
    options: { min?: number; max?: number } = {},
): number | null {
    if (value === undefined || value === null || value === '') return null;
    return requireNumber(value, field, options);
}

export function requireBoolean(value: unknown, field: string): boolean {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw badRequest(`${field} must be true or false`);
}

export function requireEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
    const candidate = typeof value === 'string' ? value.trim().toLowerCase() : '';
    const match = allowed.find((option) => option.toLowerCase() === candidate);
    if (!match) throw badRequest(`${field} must be one of: ${allowed.join(', ')}`);
    return match;
}

export function optionalEnum<T extends string>(
    value: unknown,
    field: string,
    allowed: readonly T[],
): T | null {
    if (value === undefined || value === null || value === '') return null;
    return requireEnum(value, field, allowed);
}

/** ISO-8601 instant, e.g. 2026-09-01T14:30:00.000Z. Returns a Date. */
export function requireTimestamp(value: unknown, field: string): Date {
    if (typeof value !== 'string' && !(value instanceof Date)) {
        throw badRequest(`${field} must be a date and time`);
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) throw badRequest(`${field} is not a valid date and time`);
    return date;
}

export function optionalTimestamp(value: unknown, field: string): Date | null {
    if (value === undefined || value === null || value === '') return null;
    return requireTimestamp(value, field);
}

/** Calendar date with no time component, e.g. 2026-09-01. */
export function requireDate(value: unknown, field: string): string {
    const text = requireString(value, field, { max: 32 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw badRequest(`${field} must be formatted as YYYY-MM-DD`);
    if (Number.isNaN(new Date(`${text}T00:00:00Z`).getTime())) throw badRequest(`${field} is not a real date`);
    return text;
}

export function optionalDate(value: unknown, field: string): string | null {
    if (value === undefined || value === null || value === '') return null;
    return requireDate(value, field);
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_PATTERN = /^[+(\d][\d\s()+.-]{5,19}$/;

export function requireEmail(value: unknown, field = 'email'): string {
    return requireString(value, field, { max: 150, pattern: EMAIL_PATTERN }).toLowerCase();
}

export function optionalPhone(value: unknown, field = 'phone'): string | null {
    return optionalString(value, field, { max: 20, pattern: PHONE_PATTERN });
}

/** Path parameter that must be a positive integer id. */
export function idParam(req: Request, name = 'id'): number {
    return requireInt(req.params[name], name, { min: 1, max: 2147483647 });
}

export interface Pagination {
    limit: number;
    offset: number;
    page: number;
}

export const MAX_PAGE_SIZE = 100;

/**
 * `GET /api/estimates` used to return the entire table. Every list endpoint
 * now goes through this, so a page size is always bounded whatever the caller
 * asks for.
 */
export function pagination(req: Request, defaultLimit = 25): Pagination {
    const rawLimit = req.query.limit;
    const rawPage = req.query.page;
    const rawOffset = req.query.offset;

    const limit =
        rawLimit === undefined || rawLimit === ''
            ? defaultLimit
            : requireInt(rawLimit, 'limit', { min: 1, max: MAX_PAGE_SIZE });

    if (rawOffset !== undefined && rawOffset !== '') {
        const offset = requireInt(rawOffset, 'offset', { min: 0, max: 1000000 });
        return { limit, offset, page: Math.floor(offset / limit) + 1 };
    }

    const page = rawPage === undefined || rawPage === '' ? 1 : requireInt(rawPage, 'page', { min: 1, max: 10000 });
    return { limit, offset: (page - 1) * limit, page };
}

export interface Page<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export function toPage<T>(data: T[], total: number, { page, limit }: Pagination): Page<T> {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasMore: page * limit < total,
        },
    };
}

const TAB = 9;
const LINE_FEED = 10;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const DELETE = 127;

/**
 * Strips control characters from free text before it is stored. Not an XSS
 * defence -- React escapes on render -- but it keeps log output and CSV
 * exports from being corrupted by pasted terminal junk. Tabs and newlines
 * survive because inspection notes are genuinely multi-line.
 */
export function sanitizeText(value: string): string {
    let cleaned = '';
    for (const character of value) {
        const code = character.codePointAt(0) ?? 0;
        const isAllowedWhitespace = code === TAB || code === LINE_FEED || code === CARRIAGE_RETURN;
        if (code === DELETE) continue;
        if (code < SPACE && !isAllowedWhitespace) continue;
        cleaned += character;
    }
    return cleaned.trim();
}
