"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "customer" | "inspector" | "admin";

interface MockUser {
  uid: string;
  email: string;
}

interface AuthContextType {
  currentUser: MockUser | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: null,
  loading: false,
  signUp: async () => {},
  logIn: async () => {},
  logOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading] = useState(false);

  async function signUp(email: string, password: string) {
    setCurrentUser({ uid: "mock-" + email, email });
    setRole("customer");
  }

  async function logIn(email: string, password: string) {
    setCurrentUser({ uid: "mock-" + email, email });
    setRole("customer");
  }

  async function logOut() {
    setCurrentUser(null);
    setRole(null);
  }

  const value: AuthContextType = {
    currentUser,
    role,
    loading,
    signUp,
    logIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
