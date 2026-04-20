import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

export type UserRole = "normal" | "donor" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    role: "donor" | "normal";
    full_name?: string;
  }) => Promise<{ session: Session | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string | null) => {
    if (!uid) { setProfile(null); return; }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadProfile(data.session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      await loadProfile(newSession?.user?.id ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp: AuthContextValue["signUp"] = async ({ email, password, role, full_name }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Create the profile row immediately so role is queryable on first login.
    if (data.user) {
      const { error: pErr } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: full_name ?? null,
        role,
      });
      if (pErr) throw pErr;
    }
    return { session: data.session, user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => loadProfile(user?.id ?? null);

  const value = useMemo<AuthContextValue>(() => ({
    user, session, profile, loading,
    signInWithPassword, signUp, signOut, refreshProfile,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Returns the post-login route for a given role. */
export function routeForRole(role: UserRole | null | undefined): string {
  if (role === "admin")  return "/dashboard";
  if (role === "donor")  return "/donor-dashboard";
  return "/user-profile";
}
