/**
 * The single way the browser talks to the API.
 *
 * Every service now verifies a Firebase ID token, so every request needs the
 * Authorization header. Doing that at each call site would guarantee one gets
 * missed, so all of them go through here.
 *
 * Requests are sent to relative paths only. The Next.js rewrites in
 * next.config.ts proxy them to the right service, which means the services
 * themselves never have to be reachable from a browser -- and the
 * NEXT_PUBLIC_*_SERVICE_URL variables that pointed straight at ports 3002 and
 * 3006 are gone.
 */
import { getAuth, type User } from 'firebase/auth';

export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    readonly requestId?: string;

    constructor(
        status: number,
        message: string,
        options: { code?: string; details?: unknown; requestId?: string } = {},
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = options.code ?? 'error';
        this.details = options.details;
        this.requestId = options.requestId;
    }

    /** True when signing in again is what would fix it. */
    get isAuthError(): boolean {
        return this.status === 401;
    }

    get isPermissionError(): boolean {
        return this.status === 403;
    }

    get isConflict(): boolean {
        return this.status === 409;
    }
}

async function currentUser(): Promise<User | null> {
    const auth = getAuth();
    if (auth.currentUser) return auth.currentUser;

    // On a hard refresh, Firebase restores the session asynchronously. Without
    // this wait the first request of the page fires before the token exists
    // and comes back 401.
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

async function authorizationHeader(): Promise<Record<string, string>> {
    const user = await currentUser();
    if (!user) return {};

    // getIdToken refreshes automatically when the token is close to expiring.
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    signal?: AbortSignal;
    /** Skips the auth header for genuinely public calls. */
    anonymous?: boolean;
}

async function readError(response: Response): Promise<ApiError> {
    let message = `Request failed with status ${response.status}`;
    let code: string | undefined;
    let details: unknown;

    try {
        const body = await response.json();
        if (typeof body?.error === 'string') message = body.error;
        code = body?.code;
        details = body?.details;
    } catch {
        // A proxy error or a dropped connection will not be JSON.
        if (response.status === 502 || response.status === 503 || response.status === 504) {
            message = 'That part of the system is not responding right now. Please try again shortly.';
        }
    }

    return new ApiError(response.status, message, {
        code,
        details,
        requestId: response.headers.get('x-request-id') ?? undefined,
    });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, signal, anonymous = false } = options;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!anonymous) Object.assign(headers, await authorizationHeader());

    let response: Response;
    try {
        response = await fetch(path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if ((error as Error).name === 'AbortError') throw error;
        throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
    }

    if (!response.ok) throw await readError(response);
    if (response.status === 204) return undefined as T;

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
    get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(path, { ...options, method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

/** The envelope every list endpoint returns. */
export interface Paginated<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

const EMPTY_PAGINATION = { page: 1, limit: 0, total: 0, totalPages: 1, hasMore: false };

/**
 * Reads a list response tolerantly.
 *
 * Some endpoints return a bare array (the inspector lookup, for instance) and
 * some return a page envelope. Callers that only want the rows use this and
 * stop caring which.
 */
export function rows<T>(payload: Paginated<T> | T[] | null | undefined): T[] {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
}

export function pageInfo<T>(payload: Paginated<T> | T[] | null | undefined): Paginated<T>['pagination'] {
    if (payload && !Array.isArray(payload) && payload.pagination) return payload.pagination;
    const length = Array.isArray(payload) ? payload.length : 0;
    return { ...EMPTY_PAGINATION, limit: length, total: length };
}

/** Turns anything thrown into a sentence safe to show a user. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

/** Builds a query string, skipping empty values. */
export function query(params: Record<string, string | number | boolean | null | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        search.set(key, String(value));
    }
    const serialized = search.toString();
    return serialized ? `?${serialized}` : '';
}
