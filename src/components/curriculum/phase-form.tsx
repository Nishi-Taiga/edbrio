"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface PhaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (phase: {
    phase_name: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  initialData?: {
    phase_name: string;
    start_date?: string;
    end_date?: string;
  };
  materialName?: string;
  curriculumYear?: string;
  t: (key: string) => string;
}

/** Generate weekly options for an academic year (April–March) */
function generateWeeks(year: number) {
  const weeks: { value: string; label: string; date: string }[] = [];
  const start = new Date(year, 3, 1); // April 1
  // Align to Monday
  const day = start.getDay();
  const offset = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const firstMonday = new Date(start);
  firstMonday.setDate(start.getDate() + offset);

  const end = new Date(year + 1, 2, 31); // March 31
  const cursor = new Date(firstMonday);
  let weekNum = 1;

  while (cursor <= end) {
    const monthLabel = `${cursor.getMonth() + 1}月`;
    const dateStr = cursor.toISOString().slice(0, 10);
    weeks.push({
      value: dateStr,
      label: `${monthLabel} 第${weekNum}週`,
      date: dateStr,
    });

    // Check if next week is a new month
    const nextMonday = new Date(cursor);
    nextMonday.setDate(cursor.getDate() + 7);
    if (nextMonday.getMonth() !== cursor.getMonth()) {
      weekNum = 1;
    } else {
      weekNum++;
    }

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

/** Find the closest week start date for a given date */
function dateToWeek(dateStr: string, weeks: { value: string }[]): string {
  if (!dateStr || weeks.length === 0) return "";
  const target = new Date(dateStr).getTime();
  let closest = weeks[0].value;
  let minDiff = Infinity;
  for (const w of weeks) {
    const diff = Math.abs(new Date(w.value).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w.value;
    }
  }
  return closest;
}

/** Get end-of-week date (Sunday) for a Monday date */
function weekEndDate(mondayStr: string): string {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function PhaseForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  materialName,
  curriculumYear,
  t,
}: PhaseFormProps) {
  const [phaseName, setPhaseName] = useState("");
  const [startWeek, setStartWeek] = useState("");
  const [endWeek, setEndWeek] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const year = curriculumYear
    ? parseInt(curriculumYear)
    : now.getMonth() < 3
      ? now.getFullYear() - 1
      : now.getFullYear();

  const weeks = useMemo(() => generateWeeks(year), [year]);

  useEffect(() => {
    if (open) {
      setPhaseName(initialData?.phase_name ?? "");
      setStartWeek(
        initialData?.start_date
          ? dateToWeek(initialData.start_date, weeks)
          : "",
      );
      setEndWeek(
        initialData?.end_date ? dateToWeek(initialData.end_date, weeks) : "",
      );
    }
  }, [open, initialData, weeks]);

  const handleSubmit = async () => {
    if (!phaseName.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        phase_name: phaseName.trim(),
        start_date: startWeek || undefined,
        end_date: endWeek ? weekEndDate(endWeek) : undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initialData;

  // Filter end weeks to be >= start week
  const endWeekOptions = startWeek
    ? weeks.filter((w) => w.value >= startWeek)
    : weeks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editPhase") : t("addPhase")}</DialogTitle>
          {materialName && (
            <p className="text-xs text-muted-foreground">{materialName}</p>
          )}
          <DialogDescription>
            {isEdit ? t("editPhaseDescription") : t("addPhaseDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phase-name">{t("phaseName")}</Label>
            <Input
              id="phase-name"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              placeholder={t("phaseNamePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("startDate")}</Label>
              <Select value={startWeek} onValueChange={setStartWeek}>
                <SelectTrigger className="text-xs" aria-label={t("startDate")}>
                  <SelectValue placeholder="週を選択" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {weeks.map((w) => (
                    <SelectItem
                      key={w.value}
                      value={w.value}
                      className="text-xs"
                    >
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("endDate")}</Label>
              <Select value={endWeek} onValueChange={setEndWeek}>
                <SelectTrigger className="text-xs" aria-label={t("endDate")}>
                  <SelectValue placeholder="週を選択" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {endWeekOptions.map((w) => (
                    <SelectItem
                      key={w.value}
                      value={w.value}
                      className="text-xs"
                    >
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !phaseName.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t("save") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
