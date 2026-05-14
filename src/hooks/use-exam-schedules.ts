"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExamSchedule } from "@/lib/types/database";

function tempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useExamSchedules(profileId: string | undefined) {
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setExams([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const examsRes = await supabase
        .from("exam_schedules")
        .select("*")
        .eq("profile_id", profileId)
        .order("exam_date", { ascending: true });
      if (examsRes.error) throw examsRes.error;
      setExams(examsRes.data || []);
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
      console.error(`[exam-schedules] ${label} failed; resyncing`, err);
      fetchAll();
    },
    [fetchAll],
  );

  // Optimistic CRUD — update state immediately, push to DB in the background.
  const addExam = async (
    exam: Omit<ExamSchedule, "id" | "profile_id" | "created_at" | "updated_at">,
  ) => {
    if (!profileId) return;
    const id = tempId();
    const now = new Date().toISOString();
    const optimistic: ExamSchedule = {
      id,
      profile_id: profileId,
      created_at: now,
      updated_at: now,
      ...exam,
    } as ExamSchedule;
    setExams((prev) =>
      [...prev, optimistic].sort((a, b) =>
        (a.exam_date ?? "").localeCompare(b.exam_date ?? ""),
      ),
    );
    const { error: err } = await supabase
      .from("exam_schedules")
      .insert({ id, ...exam, profile_id: profileId });
    if (err) onWriteError("addExam", err);
  };

  const updateExam = async (id: string, updates: Partial<ExamSchedule>) => {
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
    const { error: err } = await supabase
      .from("exam_schedules")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) onWriteError("updateExam", err);
  };

  const deleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    const { error: err } = await supabase
      .from("exam_schedules")
      .delete()
      .eq("id", id);
    if (err) onWriteError("deleteExam", err);
  };

  return {
    exams,
    loading,
    error,
    addExam,
    updateExam,
    deleteExam,
    refresh: fetchAll,
  };
}
