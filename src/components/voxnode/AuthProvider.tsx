import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<Session | null>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, refreshSession: async () => null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    setSession(data.session);
    setLoading(false);
    return data.session;
  }, []);

  useEffect(() => {
    // Subscribe FIRST, then read existing session to avoid race conditions.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    refreshSession().catch(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, [refreshSession]);

  return <Ctx.Provider value={{ user: session?.user ?? null, session, loading, refreshSession }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}