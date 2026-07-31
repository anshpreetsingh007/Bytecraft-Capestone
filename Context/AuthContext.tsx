"use client";

import { createContext, useContext, useEffect, useState, ReactNode,} from "react";
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type UserRole = | "client" | "inspector" | "admin" | "super_admin";

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
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    details: SignUpDetails
  ) => Promise<void>;
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

async function resolveUser(firebaseUid: string): Promise<{
  role: UserRole;
  id: number;
  firstName: string;
  lastName: string;
} | null> {
  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/api/auth/resolve/${firebaseUid}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      role: data.role,
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
    };
  } catch (error) {
    console.error("Failed to resolve user:", error);
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function clearProfile() {
    setRole(null);
    setUserId(null);
    setFirstName(null);
    setLastName(null);
  }

  async function signUp(
    email: string,
    password: string,
    details: SignUpDetails
  ) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const response = await fetch(
      `${AUTH_SERVICE_URL}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebase_uid: credential.user.uid,
          first_name: details.firstName,
          last_name: details.lastName,
          email,
          phone: details.phone,
          address: details.address,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      await signOut(auth);

      throw new Error(
        errorData.error || "Failed to complete registration"
      );
    }

    const registeredUser = await response.json();

    setRole("client");
    setUserId(registeredUser.id);
    setFirstName(registeredUser.firstName);
    setLastName(registeredUser.lastName);
  }

  async function logIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const resolvedUser = await resolveUser(
      credential.user.uid
    );

    if (resolvedUser) {
      setRole(resolvedUser.role);
      setUserId(resolvedUser.id);
      setFirstName(resolvedUser.firstName);
      setLastName(resolvedUser.lastName);
    } else {
      clearProfile();
    }
  }

  async function logOut() {
    await signOut(auth);
    clearProfile();
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setCurrentUser(user);

        if (user) {
          const resolvedUser = await resolveUser(user.uid);

          if (resolvedUser) {
            setRole(resolvedUser.role);
            setUserId(resolvedUser.id);
            setFirstName(resolvedUser.firstName);
            setLastName(resolvedUser.lastName);
          } else {
            clearProfile();
          }
        } else {
          clearProfile();
        }

        setLoading(false);
      }
    );

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