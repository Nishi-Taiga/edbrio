"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TestScore } from "@/lib/types/database";

function tempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTestScores(profileId: string | undefined) {
  const [scores, setScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setScores([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const scoresRes = await supabase
        .from("test_scores")
        .select("*")
        .eq("profile_id", profileId)
        .order("test_date", { ascending: false });
      if (scoresRes.error) throw scoresRes.error;
      setScores(scoresRes.data || []);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAll().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [fetchAll]);

  const onWriteError = useCallback(
    (label: string, err: unknown) => {
      console.error(`[test-scores] ${label} failed; resyncing`, err);
      fetchAll();
    },
    [fetchAll],
  );

  // Optimistic CRUD — update state immediately, push to DB in the background.
  const addScore = async (
    score: Omit<TestScore, "id" | "profile_id" | "created_at" | "updated_at">,
  ) => {
    if (!profileId) return;
    const id = tempId();
    const now = new Date().toISOString();
    const optimistic: TestScore = {
      id,
      profile_id: profileId,
      created_at: now,
      updated_at: now,
      ...score,
    } as TestScore;
    setScores((prev) =>
      [optimistic, ...prev].sort((a, b) =>
        (b.test_date ?? "").localeCompare(a.test_date ?? ""),
      ),
    );
    const { error: err } = await supabase
      .from("test_scores")
      .insert({ id, ...score, profile_id: profileId });
    if (err) onWriteError("addScore", err);
  };

  const updateScore = async (id: string, updates: Partial<TestScore>) => {
    setScores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
    const { error: err } = await supabase
      .from("test_scores")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) onWriteError("updateScore", err);
  };

  const deleteScore = async (id: string) => {
    setScores((prev) => prev.filter((s) => s.id !== id));
    const { error: err } = await supabase
      .from("test_scores")
      .delete()
      .eq("id", id);
    if (err) onWriteError("deleteScore", err);
  };

  return {
    scores,
    loading,
    error,
    addScore,
    updateScore,
    deleteScore,
    refresh: fetchAll,
  };
}
