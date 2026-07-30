export type UserRole = 'admin' | 'inspector' | 'client';

// What the frontend gets back after resolving a Firebase UID
export interface ResolvedUser {
    role: UserRole;
    id: number;              // admin_id / inspector_id / client_id, depending on role
    firstName: string;
    lastName: string;
    email: string;
}

// Payload for self-service signup. Public signup always creates a client —
// admin/inspector accounts are provisioned separately (not self-serve).
export interface RegisterClientInput {
    firebase_uid: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
}