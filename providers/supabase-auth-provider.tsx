"use client";
import useAuthStore from "@/stores/use-auth-store";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // Get current session on mount

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setUser, supabase.auth]);

  return <>{children}</>;
}
