"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2, Loader2 } from "lucide-react";
import type { CurriculumPhase, PhaseTask } from "@/lib/types/database";

interface PhaseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: CurriculumPhase | null;
  materialName: string;
  tasks: PhaseTask[];
  onAddTask: (task: { phase_id: string; task_name: string }) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<PhaseTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdatePhase: (
    id: string,
    updates: Partial<CurriculumPhase>,
  ) => Promise<void>;
}

export function PhaseDetailDialog({
  open,
  onOpenChange,
  phase,
  materialName,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdatePhase,
}: PhaseDetailDialogProps) {
  const [newTaskName, setNewTaskName] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!phase) return null;

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddTask = async () => {
    const trimmed = newTaskName.trim();
    if (!trimmed || addingTask) return;
    setAddingTask(true);
    try {
      await onAddTask({ phase_id: phase.id, task_name: trimmed });
      setNewTaskName("");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (task: PhaseTask) => {
    setTogglingId(task.id);
    try {
      await onUpdateTask(task.id, { is_completed: !task.is_completed });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteTask(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (status: CurriculumPhase["status"]) => {
    if (status === phase.status || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await onUpdatePhase(phase.id, { status });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
  };

  const statusOptions: { value: CurriculumPhase["status"]; label: string }[] = [
    { value: "not_started", label: "未着手" },
    { value: "in_progress", label: "進行中" },
    { value: "completed", label: "完了" },
  ];

  const getStatusButtonClass = (value: CurriculumPhase["status"]) => {
    const isActive = phase.status === value;
    if (value === "not_started") {
      return isActive
        ? "bg-gray-200 text-gray-800 border-gray-300"
        : "bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50";
    }
    if (value === "in_progress") {
      return isActive
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : "bg-transparent text-gray-500 border-gray-200 hover:bg-blue-50";
    }
    return isActive
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-transparent text-gray-500 border-gray-200 hover:bg-green-50";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{phase.phase_name}</DialogTitle>
          <p className="text-xs text-muted-foreground">{materialName}</p>
        </DialogHeader>

        {/* Status selector — auto-computed when tasks exist */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">ステータス</span>
          {totalCount > 0 ? (
            <div className="flex gap-2">
              {statusOptions.map((opt) => {
                const autoStatus: CurriculumPhase["status"] =
                  progressPercent === 0
                    ? "not_started"
                    : progressPercent === 100
                      ? "completed"
                      : "in_progress";
                const isActive = autoStatus === opt.value;
                return (
                  <div
                    key={opt.value}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium text-center ${isActive ? getStatusButtonClass(opt.value) : "bg-transparent text-gray-400 border-gray-200"}`}
                  >
                    {isActive && (
                      <Check className="mr-1 inline-block h-3 w-3" />
                    )}
                    {opt.label}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${getStatusButtonClass(opt.value)} disabled:opacity-50`}
                >
                  {phase.status === opt.value && (
                    <Check className="mr-1 inline-block h-3 w-3" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Task list */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">タスク</span>
          <div className="max-h-[240px] space-y-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                タスクを追加して進捗を管理しましょう
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={task.is_completed}
                    disabled={togglingId === task.id}
                    onCheckedChange={() => handleToggleTask(task)}
                    className={
                      task.is_completed
                        ? "border-green-500 bg-green-500 text-white data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                        : ""
                    }
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.is_completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {task.task_name}
                    {task.is_completed && task.completed_at && (
                      <span className="ml-2 text-[10px] text-muted-foreground/60 no-underline">
                        {new Date(task.completed_at).toLocaleDateString(
                          "ja-JP",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    )}
                  </span>
                  {togglingId === task.id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={deletingId === task.id}
                    className="opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                    aria-label="タスクを削除"
                  >
                    {deletingId === task.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add task input */}
        <div className="flex items-center gap-2">
          <Input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="新しいタスクを追加..."
            className="h-8 text-sm"
            disabled={addingTask}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddTask}
            disabled={addingTask || !newTaskName.trim()}
            className="h-8 w-8 shrink-0"
          >
            {addingTask ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
