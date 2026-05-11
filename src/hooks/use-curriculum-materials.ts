"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CurriculumMaterial,
  CurriculumPhase,
  PhaseTask,
} from "@/lib/types/database";
import {
  weekIndexToStartDate,
  weekIndexToEndDate,
} from "@/lib/curriculum/week";

/**
 * Derive start_date / end_date from start_week / end_week when present, so the
 * legacy date columns stay in sync. Uses the material's curriculum_year.
 */
function deriveDatesForPhase<T extends Partial<CurriculumPhase>>(
  phase: T,
  curriculumYear: number | undefined,
): T {
  if (!curriculumYear) return phase;
  const next = { ...phase };
  if (phase.start_week != null) {
    next.start_date = weekIndexToStartDate(curriculumYear, phase.start_week);
  }
  if (phase.end_week != null) {
    next.end_date = weekIndexToEndDate(curriculumYear, phase.end_week);
  }
  return next;
}

/**
 * Generate a stable temporary id for optimistic inserts.
 * `crypto.randomUUID` is supported in modern browsers and on Vercel Edge.
 */
function tempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useCurriculumMaterials(
  profileId: string | undefined,
  curriculumYear?: string,
) {
  const [materials, setMaterials] = useState<CurriculumMaterial[]>([]);
  const [phases, setPhases] = useState<CurriculumPhase[]>([]);
  const [phaseTasks, setPhaseTasks] = useState<PhaseTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setMaterials([]);
      setPhases([]);
      setPhaseTasks([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      let query = supabase
        .from("curriculum_materials")
        .select("*")
        .eq("profile_id", profileId)
        .order("order_index", { ascending: true });

      if (curriculumYear) {
        query = query.eq("curriculum_year", curriculumYear);
      }

      let materialsRes = await query;
      // Fallback: if curriculum_year column doesn't exist yet, retry without filter
      if (materialsRes.error && curriculumYear) {
        materialsRes = await supabase
          .from("curriculum_materials")
          .select("*")
          .eq("profile_id", profileId)
          .order("order_index", { ascending: true });
      }
      if (materialsRes.error) throw materialsRes.error;
      const fetchedMaterials = materialsRes.data || [];
      setMaterials(fetchedMaterials);

      if (fetchedMaterials.length > 0) {
        const materialIds = fetchedMaterials.map((m) => m.id);
        const phasesRes = await supabase
          .from("curriculum_phases")
          .select("*")
          .in("material_id", materialIds)
          .order("order_index", { ascending: true });
        if (phasesRes.error) throw phasesRes.error;
        const fetchedPhases = phasesRes.data || [];
        setPhases(fetchedPhases);

        if (fetchedPhases.length > 0) {
          const phaseIds = fetchedPhases.map((p) => p.id);
          const tasksRes = await supabase
            .from("phase_tasks")
            .select("*")
            .in("phase_id", phaseIds)
            .order("order_index", { ascending: true });
          if (tasksRes.error) {
            console.warn("phase_tasks fetch skipped:", tasksRes.error.message);
            setPhaseTasks([]);
          } else {
            setPhaseTasks(tasksRes.data || []);
          }
        } else {
          setPhaseTasks([]);
        }
      } else {
        setPhases([]);
        setPhaseTasks([]);
      }
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
  }, [profileId, curriculumYear, supabase]);

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

  // ── Optimistic CRUD ──
  // Pattern: update local state immediately so the UI reflects the change with
  // zero perceived latency, send to DB in the background, and only call
  // fetchAll() to resync when the server rejects the write.

  const onWriteError = useCallback(
    (label: string, err: unknown) => {
      console.error(`[curriculum] ${label} failed; resyncing`, err);
      fetchAll();
    },
    [fetchAll],
  );

  // Materials CRUD
  const addMaterial = async (
    material: Omit<
      CurriculumMaterial,
      "id" | "profile_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!profileId) return;
    const id = tempId();
    const now = new Date().toISOString();
    const optimistic: CurriculumMaterial = {
      id,
      profile_id: profileId,
      created_at: now,
      updated_at: now,
      ...material,
    } as CurriculumMaterial;
    setMaterials((prev) => [...prev, optimistic]);
    const { error: err } = await supabase
      .from("curriculum_materials")
      .insert({ id, ...material, profile_id: profileId });
    if (err) onWriteError("addMaterial", err);
  };

  const updateMaterial = async (
    id: string,
    updates: Partial<CurriculumMaterial>,
  ) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
    const { error: err } = await supabase
      .from("curriculum_materials")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) onWriteError("updateMaterial", err);
  };

  const deleteMaterial = async (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setPhases((prev) => prev.filter((p) => p.material_id !== id));
    const { error: err } = await supabase
      .from("curriculum_materials")
      .delete()
      .eq("id", id);
    if (err) onWriteError("deleteMaterial", err);
  };

  // Phases CRUD
  const addPhase = async (
    phase: Omit<CurriculumPhase, "id" | "created_at" | "updated_at">,
  ) => {
    const material = materials.find((m) => m.id === phase.material_id);
    const year = material?.curriculum_year
      ? Number(material.curriculum_year)
      : undefined;
    const finalPhase = deriveDatesForPhase(phase, year);
    const id = tempId();
    const now = new Date().toISOString();
    const optimistic: CurriculumPhase = {
      id,
      created_at: now,
      updated_at: now,
      ...finalPhase,
    } as CurriculumPhase;
    setPhases((prev) => [...prev, optimistic]);
    const { error: err } = await supabase
      .from("curriculum_phases")
      .insert({ id, ...finalPhase });
    if (err) onWriteError("addPhase", err);
  };

  const updatePhase = async (id: string, updates: Partial<CurriculumPhase>) => {
    const phase = phases.find((p) => p.id === id);
    const material = materials.find((m) => m.id === phase?.material_id);
    const year = material?.curriculum_year
      ? Number(material.curriculum_year)
      : undefined;
    const finalUpdates = deriveDatesForPhase(updates, year);
    setPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...finalUpdates } : p)),
    );
    const { error: err } = await supabase
      .from("curriculum_phases")
      .update({ ...finalUpdates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) onWriteError("updatePhase", err);
  };

  const deletePhase = async (id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id));
    setPhaseTasks((prev) => prev.filter((t) => t.phase_id !== id));
    const { error: err } = await supabase
      .from("curriculum_phases")
      .delete()
      .eq("id", id);
    if (err) onWriteError("deletePhase", err);
  };

  // Phase Tasks CRUD
  const addTask = async (task: {
    phase_id: string;
    task_name: string;
    order_index?: number;
  }) => {
    const existingTasks = phaseTasks.filter(
      (t) => t.phase_id === task.phase_id,
    );
    const order_index = task.order_index ?? existingTasks.length;
    const id = tempId();
    const now = new Date().toISOString();
    const optimistic: PhaseTask = {
      id,
      phase_id: task.phase_id,
      task_name: task.task_name,
      is_completed: false,
      order_index,
      created_at: now,
    };
    setPhaseTasks((prev) => [...prev, optimistic]);
    const { error: err } = await supabase
      .from("phase_tasks")
      .insert({ id, ...task, order_index });
    if (err) onWriteError("addTask", err);
  };

  const updateTask = async (id: string, updates: Partial<PhaseTask>) => {
    const finalUpdates = { ...updates };
    if ("is_completed" in updates) {
      finalUpdates.completed_at = updates.is_completed
        ? new Date().toISOString()
        : undefined;
    }
    setPhaseTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)),
    );
    const { error: err } = await supabase
      .from("phase_tasks")
      .update(finalUpdates)
      .eq("id", id);
    if (err) onWriteError("updateTask", err);
  };

  const deleteTask = async (id: string) => {
    setPhaseTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: err } = await supabase
      .from("phase_tasks")
      .delete()
      .eq("id", id);
    if (err) onWriteError("deleteTask", err);
  };

  // Copy curriculum to next year — bulk write, harder to keep optimistic, so
  // we accept the wait here and refetch on completion.
  const copyToNextYear = async (nextYear: string) => {
    if (!profileId) return;
    for (const mat of materials) {
      const { data: newMat, error: matErr } = await supabase
        .from("curriculum_materials")
        .insert({
          profile_id: profileId,
          subject: mat.subject,
          material_name: mat.material_name,
          study_pace: mat.study_pace,
          color: mat.color,
          order_index: mat.order_index,
          notes: mat.notes,
          curriculum_year: nextYear,
        })
        .select("id")
        .single();
      if (matErr || !newMat) continue;

      const matPhases = phases.filter((p) => p.material_id === mat.id);
      const nextYearNum = Number(nextYear);
      for (const phase of matPhases) {
        await supabase.from("curriculum_phases").insert(
          deriveDatesForPhase(
            {
              material_id: newMat.id,
              phase_name: phase.phase_name,
              total_hours: phase.total_hours,
              start_week: phase.start_week,
              end_week: phase.end_week,
              is_date_manual: phase.is_date_manual,
              status: "not_started",
              order_index: phase.order_index,
            },
            Number.isFinite(nextYearNum) ? nextYearNum : undefined,
          ),
        );
      }
    }
    await fetchAll();
  };

  // Batch reorder materials (update order_index for multiple items)
  const reorderMaterials = async (
    updates: Array<{ id: string; order_index: number }>,
  ) => {
    const map = new Map(updates.map((u) => [u.id, u.order_index]));
    setMaterials((prev) =>
      [...prev]
        .map((m) =>
          map.has(m.id) ? { ...m, order_index: map.get(m.id)! } : m,
        )
        .sort((a, b) => a.order_index - b.order_index),
    );
    // Send all updates in parallel; resync if any fails.
    const results = await Promise.all(
      updates.map(({ id, order_index }) =>
        supabase
          .from("curriculum_materials")
          .update({ order_index, updated_at: new Date().toISOString() })
          .eq("id", id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) onWriteError("reorderMaterials", failed.error);
  };

  return {
    materials,
    phases,
    phaseTasks,
    loading,
    error,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addPhase,
    updatePhase,
    deletePhase,
    addTask,
    updateTask,
    deleteTask,
    copyToNextYear,
    reorderMaterials,
    refresh: fetchAll,
  };
}
