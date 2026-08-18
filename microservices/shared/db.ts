/**
 * A structural description of the bits of a `pg.Pool` this kit uses.
 *
 * Typing against this instead of importing `pg` keeps the shared kit free of
 * a database dependency -- which matters because ai-chatbot-service has no
 * database at all and would otherwise fail to compile on a type-only import
 * of a package it does not have installed.
 *
 * A real `pg.Pool` satisfies this shape, so services pass theirs in directly.
 */
export interface QueryResultLike {
    rows: any[];
    rowCount: number | null;
}

export interface PoolClientLike {
    query(text: string, values?: any[]): Promise<QueryResultLike>;
    release(): void;
}

export interface DatabasePool {
    query(text: string, values?: any[]): Promise<QueryResultLike>;
    connect(): Promise<PoolClientLike>;
    on(event: 'error', listener: (error: Error) => void): unknown;
    end(): Promise<void>;
}
