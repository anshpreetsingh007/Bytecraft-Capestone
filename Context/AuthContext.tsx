"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { ApiError, api } from "@/lib/api";

export type UserRole = "client" | "inspector" | "admin" | "super_admin";

interface SignUpDetails {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  acceptedTerms?: boolean;
}

interface Profile {
  role: UserRole;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  loading: boolean;
  /** Set when the account exists in Firebase but has no profile row yet. */
  needsRegistration: boolean;

  signUp: (email: string, password: string, details: SignUpDetails) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: null,
  userId: null,
  firstName: null,
  lastName: null,
  loading: true,
  needsRegistration: false,

  signUp: async () => {},
  logIn: async () => {},
  logOut: async () => {},
  forgotPassword: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Reads the profile of whoever holds the current token.
 *
 * This used to be `GET /api/auth/resolve/{uid}` with the uid taken from the
 * client — an endpoint that was open to anyone and would map any uid to a
 * name, email and role. `/api/auth/me` derives the identity from the verified
 * token instead, so there is nothing to guess.
 */
async function fetchProfile(): Promise<{ profile: Profile | null; unregistered: boolean }> {
  try {
    const profile = await api.get<Profile>("/api/auth/me");
    return { profile, unregistered: false };
  } catch (error) {
    // 404 is the normal state between Firebase signup and /register.
    if (error instanceof ApiError && error.status === 404) {
      return { profile: null, unregistered: true };
    }
    console.error("Failed to load profile:", error);
    return { profile: null, unregistered: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { profile: loaded, unregistered } = await fetchProfile();
    setProfile(loaded);
    setNeedsRegistration(unregistered);
  }, []);

  async function signUp(email: string, password: string, details: SignUpDetails) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    try {
      // The token is what proves which account this is; the service reads the
      // uid and email from it rather than from the body.
      const registered = await api.post<Profile>("/api/auth/register", {
        first_name: details.firstName,
        last_name: details.lastName,
        phone: details.phone || null,
        address: details.address || null,
        accepted_terms: details.acceptedTerms ?? true,
      });

      setProfile(registered);
      setNeedsRegistration(false);
    } catch (error) {
      // Leaving a Firebase account with no profile behind would strand the
      // user in a half-registered state they cannot get out of.
      await signOut(auth).catch(() => undefined);
      throw new Error(
        error instanceof ApiError ? error.message : "Failed to complete registration",
      );
    }
  }

  async function logIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
    await loadProfile();
  }

  async function logOut() {
    await signOut(auth);
    setProfile(null);
    setNeedsRegistration(false);
  }

  async function forgotPassword(email: string) {
    await sendPasswordResetEmail(auth, email.trim());
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await loadProfile();
      } else {
        setProfile(null);
        setNeedsRegistration(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [loadProfile]);

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      role: profile?.role ?? null,
      userId: profile?.id ?? null,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      loading,
      needsRegistration,
      signUp,
      logIn,
      logOut,
      forgotPassword,
      refreshProfile: loadProfile,
    }),
    // signUp/logIn/logOut/forgotPassword are stable in practice: they only
    // close over setState functions and `auth`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, profile, loading, needsRegistration, loadProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
