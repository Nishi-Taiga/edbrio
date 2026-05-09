"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { User as DbUser } from "@/lib/types/database";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchDbUser = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        // When no row exists yet, don't treat as an error; allow app to continue.
        if (error) {
          const msg = (error as { message?: string })?.message || String(error);
          if (!msg?.toLowerCase().includes("no rows")) {
            console.error("Error fetching user data:", msg);
          }
          setDbUser(null);
          return;
        }

        setDbUser(data ?? null);
      } catch (error: unknown) {
        console.error(
          "Error fetching user data:",
          error instanceof Error ? error.message : error,
        );
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchDbUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchDbUser(session.user.id);
      } else {
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchDbUser]);

  const refreshDbUser = useCallback(async () => {
    if (user?.id) {
      await fetchDbUser(user.id);
    }
  }, [user?.id, fetchDbUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    dbUser,
    loading,
    signOut,
    refreshDbUser,
    isTeacher: dbUser?.role === "teacher",
    isGuardian: dbUser?.role === "guardian",
    isStudent: dbUser?.role === "student",
    isSchool: dbUser?.role === "school",
  };
}
