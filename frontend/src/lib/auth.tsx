"use client";

/**
 * Minimal auth state shared across the app: who is signed in, and helpers to
 * sign in/up/out. Backed entirely by the backend session cookie — this context
 * just mirrors it into React state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api, type User } from "@/lib/api";

type AuthContextValue = {
  user: User | null;
  /** True until the initial `/me` check resolves. */
  loading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load.
  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch((error) => {
        // 401 simply means "not signed in"; anything else is unexpected.
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error("Failed to restore session", error);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    setUser(await api.signin(email, password));
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setUser(await api.signup(email, password));
  }, []);

  const signout = useCallback(async () => {
    await api.signout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
