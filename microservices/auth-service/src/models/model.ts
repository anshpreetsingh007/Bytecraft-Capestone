export type UserRole = "client" | "inspector" | "admin" | "super_admin";

export interface ResolvedUser {
  role: UserRole;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface RegisterClientInput {
  firebase_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
}
