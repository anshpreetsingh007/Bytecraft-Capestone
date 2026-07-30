"use client";

import {createContext, useContext, useEffect, useState, ReactNode} from "react";
import {User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type UserRole = "client" | "inspector" | "admin";

// TODO: move to NEXT_PUBLIC_AUTH_SERVICE_URL once the rest of the frontend
// adopts env-based service URLs (currently other pages hardcode localhost too).
const AUTH_SERVICE_URL = "";

interface SignUpDetails {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  userId: number | null; // admin_id / inspector_id / client_id from Postgres
  firstName: string | null;
  lastName: string | null;
  loading: boolean;
  signUp: (email: string, password: string, details: SignUpDetails) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: null,
  userId: null,
  firstName: null,
  lastName: null,
  loading: true,
  signUp: async () => {},
  logIn: async () => {},
  logOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Calls auth-service to resolve a Firebase UID to a Postgres role + id.
// Returns null if there's no matching row yet (e.g. registration hasn't
// finished, or the auth-service is unreachable).
async function resolveUser(firebaseUid: string): Promise<{
  role: UserRole;
  id: number;
  firstName: string;
  lastName: string;
} | null> {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/resolve/${firebaseUid}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { role: data.role, id: data.id, firstName: data.firstName, lastName: data.lastName };
  } catch (err) {
    console.error("Failed to resolve user role:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function signUp(email: string, password: string, details: SignUpDetails) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // Create the matching Postgres client row right away so resolution
    // (here and on future logins/refreshes) succeeds immediately.
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: credential.user.uid,
        first_name: details.firstName,
        last_name: details.lastName,
        email,
        phone: details.phone,
        address: details.address,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to complete registration");
    }

    const registered = await res.json();
    setRole("client");
    setUserId(registered.id);
    setFirstName(registered.firstName);
    setLastName(registered.lastName);
  }

  async function logIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    const resolved = await resolveUser(credential.user.uid);
    if (resolved) {
      setRole(resolved.role);
      setUserId(resolved.id);
      setFirstName(resolved.firstName);
      setLastName(resolved.lastName);
    } else {
      // Authenticated with Firebase but no Postgres record found —
      // RoleGuard will send them to /redirecting, which handles this case.
      setRole(null);
      setUserId(null);
    }
  }

  async function logOut() {
    await signOut(auth);
    setRole(null);
    setUserId(null);
    setFirstName(null);
    setLastName(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const resolved = await resolveUser(user.uid);
        if (resolved) {
          setRole(resolved.role);
          setUserId(resolved.id);
          setFirstName(resolved.firstName);
          setLastName(resolved.lastName);
        } else {
          setRole(null);
          setUserId(null);
        }
      } else {
        setRole(null);
        setUserId(null);
        setFirstName(null);
        setLastName(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    role,
    userId,
    firstName,
    lastName,
    loading,
    signUp,
    logIn,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
