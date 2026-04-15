"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CurriculumMaterial,
  CurriculumPhase,
  PhaseTask,
} from "@/lib/types/database";

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
      setLoading(true);
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

        // Fetch phase tasks (graceful: skip if table not yet created)
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
    fetchAll().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [fetchAll]);

  // Materials CRUD
  const addMaterial = async (
    material: Omit<
      CurriculumMaterial,
      "id" | "profile_id" | "created_at" | "updated_at"
    >,
  ) => {
    const { error: err } = await supabase
      .from("curriculum_materials")
      .insert({ ...material, profile_id: profileId });
    if (err) throw err;
    await fetchAll();
  };

  const updateMaterial = async (
    id: string,
    updates: Partial<CurriculumMaterial>,
  ) => {
    const { error: err } = await supabase
      .from("curriculum_materials")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) throw err;
    await fetchAll();
  };

  const deleteMaterial = async (id: string) => {
    const { error: err } = await supabase
      .from("curriculum_materials")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await fetchAll();
  };

  // Phases CRUD
  const addPhase = async (
    phase: Omit<CurriculumPhase, "id" | "created_at" | "updated_at">,
  ) => {
    const { error: err } = await supabase
      .from("curriculum_phases")
      .insert(phase);
    if (err) throw err;
    await fetchAll();
  };

  const updatePhase = async (id: string, updates: Partial<CurriculumPhase>) => {
    const { error: err } = await supabase
      .from("curriculum_phases")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) throw err;
    await fetchAll();
  };

  const deletePhase = async (id: string) => {
    const { error: err } = await supabase
      .from("curriculum_phases")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await fetchAll();
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
    const { error: err } = await supabase
      .from("phase_tasks")
      .insert({
        ...task,
        order_index: task.order_index ?? existingTasks.length,
      });
    if (err) throw err;
    await fetchAll();
  };

  const updateTask = async (id: string, updates: Partial<PhaseTask>) => {
    // Auto-set completed_at when checking/unchecking
    const finalUpdates = { ...updates };
    if ("is_completed" in updates) {
      finalUpdates.completed_at = updates.is_completed
        ? new Date().toISOString()
        : undefined;
    }
    const { error: err } = await supabase
      .from("phase_tasks")
      .update(finalUpdates)
      .eq("id", id);
    if (err) throw err;
    await fetchAll();
  };

  const deleteTask = async (id: string) => {
    const { error: err } = await supabase
      .from("phase_tasks")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await fetchAll();
  };

  // Copy curriculum to next year
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
      for (const phase of matPhases) {
        // Shift dates by 1 year
        const shiftDate = (d?: string) => {
          if (!d) return undefined;
          const date = new Date(d);
          date.setFullYear(date.getFullYear() + 1);
          return date.toISOString().slice(0, 10);
        };
        await supabase.from("curriculum_phases").insert({
          material_id: newMat.id,
          phase_name: phase.phase_name,
          total_hours: phase.total_hours,
          start_date: shiftDate(phase.start_date),
          end_date: shiftDate(phase.end_date),
          is_date_manual: phase.is_date_manual,
          status: "not_started",
          order_index: phase.order_index,
        });
      }
    }
    await fetchAll();
  };

  // Batch reorder materials (update order_index for multiple items)
  const reorderMaterials = async (
    updates: Array<{ id: string; order_index: number }>,
  ) => {
    for (const { id, order_index } of updates) {
      await supabase
        .from("curriculum_materials")
        .update({ order_index, updated_at: new Date().toISOString() })
        .eq("id", id);
    }
    await fetchAll();
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
