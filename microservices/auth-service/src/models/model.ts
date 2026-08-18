export type UserRole = 'client' | 'inspector' | 'admin' | 'super_admin';

export const ASSIGNABLE_ROLES: readonly UserRole[] = ['client', 'inspector', 'admin'];

export interface ResolvedUser {
    role: UserRole;
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
}

export interface DirectoryUser extends ResolvedUser {
    firebaseUid: string;
    phone: string | null;
}

export interface RegisterClientInput {
    firebase_uid: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    consent_version: string | null;
}

export interface UpdateProfileInput {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    address?: string | null;
}

export interface InspectorSummary {
    inspector_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}
