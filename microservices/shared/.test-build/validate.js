"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAGE_SIZE = exports.PHONE_PATTERN = exports.EMAIL_PATTERN = void 0;
exports.requireString = requireString;
exports.optionalString = optionalString;
exports.requireInt = requireInt;
exports.optionalInt = optionalInt;
exports.requireNumber = requireNumber;
exports.optionalNumber = optionalNumber;
exports.requireBoolean = requireBoolean;
exports.requireEnum = requireEnum;
exports.optionalEnum = optionalEnum;
exports.requireTimestamp = requireTimestamp;
exports.optionalTimestamp = optionalTimestamp;
exports.requireDate = requireDate;
exports.optionalDate = optionalDate;
exports.requireEmail = requireEmail;
exports.optionalPhone = optionalPhone;
exports.idParam = idParam;
exports.pagination = pagination;
exports.toPage = toPage;
exports.sanitizeText = sanitizeText;
const errors_1 = require("./errors");
function requireString(value, field, options = {}) {
    if (typeof value !== 'string')
        throw (0, errors_1.badRequest)(`${field} must be text`);
    const trimmed = value.trim();
    const { min = 1, max = 1000, pattern } = options;
    if (trimmed.length < min) {
        throw (0, errors_1.badRequest)(min === 1 ? `${field} is required` : `${field} must be at least ${min} characters`);
    }
    if (trimmed.length > max)
        throw (0, errors_1.badRequest)(`${field} must be ${max} characters or fewer`);
    if (pattern && !pattern.test(trimmed))
        throw (0, errors_1.badRequest)(`${field} is not in the expected format`);
    return trimmed;
}
function optionalString(value, field, options = {}) {
    if (value === undefined || value === null || value === '')
        return null;
    return requireString(value, field, { min: 1, ...options });
}
function requireInt(value, field, options = {}) {
    const { min = 1, max = Number.MAX_SAFE_INTEGER } = options;
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    if (!Number.isInteger(parsed))
        throw (0, errors_1.badRequest)(`${field} must be a whole number`);
    if (parsed < min || parsed > max)
        throw (0, errors_1.badRequest)(`${field} must be between ${min} and ${max}`);
    return parsed;
}
function optionalInt(value, field, options = {}) {
    if (value === undefined || value === null || value === '')
        return null;
    return requireInt(value, field, options);
}
function requireNumber(value, field, options = {}) {
    const { min = 0, max = Number.MAX_SAFE_INTEGER } = options;
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    if (!Number.isFinite(parsed))
        throw (0, errors_1.badRequest)(`${field} must be a number`);
    if (parsed < min || parsed > max)
        throw (0, errors_1.badRequest)(`${field} must be between ${min} and ${max}`);
    return parsed;
}
function optionalNumber(value, field, options = {}) {
    if (value === undefined || value === null || value === '')
        return null;
    return requireNumber(value, field, options);
}
function requireBoolean(value, field) {
    if (typeof value === 'boolean')
        return value;
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    throw (0, errors_1.badRequest)(`${field} must be true or false`);
}
function requireEnum(value, field, allowed) {
    const candidate = typeof value === 'string' ? value.trim().toLowerCase() : '';
    const match = allowed.find((option) => option.toLowerCase() === candidate);
    if (!match)
        throw (0, errors_1.badRequest)(`${field} must be one of: ${allowed.join(', ')}`);
    return match;
}
function optionalEnum(value, field, allowed) {
    if (value === undefined || value === null || value === '')
        return null;
    return requireEnum(value, field, allowed);
}
/** ISO-8601 instant, e.g. 2026-09-01T14:30:00.000Z. Returns a Date. */
function requireTimestamp(value, field) {
    if (typeof value !== 'string' && !(value instanceof Date)) {
        throw (0, errors_1.badRequest)(`${field} must be a date and time`);
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        throw (0, errors_1.badRequest)(`${field} is not a valid date and time`);
    return date;
}
function optionalTimestamp(value, field) {
    if (value === undefined || value === null || value === '')
        return null;
    return requireTimestamp(value, field);
}
/** Calendar date with no time component, e.g. 2026-09-01. */
function requireDate(value, field) {
    const text = requireString(value, field, { max: 32 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text))
        throw (0, errors_1.badRequest)(`${field} must be formatted as YYYY-MM-DD`);
    if (Number.isNaN(new Date(`${text}T00:00:00Z`).getTime()))
        throw (0, errors_1.badRequest)(`${field} is not a real date`);
    return text;
}
function optionalDate(value, field) {
    if (value === undefined || value === null || value === '')
        return null;
    return requireDate(value, field);
}
exports.EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
exports.PHONE_PATTERN = /^[+(\d][\d\s()+.-]{5,19}$/;
function requireEmail(value, field = 'email') {
    return requireString(value, field, { max: 150, pattern: exports.EMAIL_PATTERN }).toLowerCase();
}
function optionalPhone(value, field = 'phone') {
    return optionalString(value, field, { max: 20, pattern: exports.PHONE_PATTERN });
}
/** Path parameter that must be a positive integer id. */
function idParam(req, name = 'id') {
    return requireInt(req.params[name], name, { min: 1, max: 2147483647 });
}
exports.MAX_PAGE_SIZE = 100;
/**
 * `GET /api/estimates` used to return the entire table. Every list endpoint
 * now goes through this, so a page size is always bounded whatever the caller
 * asks for.
 */
function pagination(req, defaultLimit = 25) {
    const rawLimit = req.query.limit;
    const rawPage = req.query.page;
    const rawOffset = req.query.offset;
    const limit = rawLimit === undefined || rawLimit === ''
        ? defaultLimit
        : requireInt(rawLimit, 'limit', { min: 1, max: exports.MAX_PAGE_SIZE });
    if (rawOffset !== undefined && rawOffset !== '') {
        const offset = requireInt(rawOffset, 'offset', { min: 0, max: 1000000 });
        return { limit, offset, page: Math.floor(offset / limit) + 1 };
    }
    const page = rawPage === undefined || rawPage === '' ? 1 : requireInt(rawPage, 'page', { min: 1, max: 10000 });
    return { limit, offset: (page - 1) * limit, page };
}
function toPage(data, total, { page, limit }) {
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
function sanitizeText(value) {
    let cleaned = '';
    for (const character of value) {
        const code = character.codePointAt(0) ?? 0;
        const isAllowedWhitespace = code === TAB || code === LINE_FEED || code === CARRIAGE_RETURN;
        if (code === DELETE)
            continue;
        if (code < SPACE && !isAllowedWhitespace)
            continue;
        cleaned += character;
    }
    return cleaned.trim();
}
