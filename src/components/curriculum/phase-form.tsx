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
import { generateWeekOptions } from "@/lib/curriculum/week";

interface PhaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (phase: {
    phase_name: string;
    start_week?: number;
    end_week?: number;
  }) => Promise<void>;
  initialData?: {
    phase_name: string;
    start_week?: number;
    end_week?: number;
  };
  materialName?: string;
  curriculumYear?: string;
  t: (key: string) => string;
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
  const [startWeek, setStartWeek] = useState<string>("");
  const [endWeek, setEndWeek] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const year = curriculumYear
    ? parseInt(curriculumYear)
    : now.getMonth() < 3
      ? now.getFullYear() - 1
      : now.getFullYear();

  const weeks = useMemo(() => generateWeekOptions(year), [year]);

  useEffect(() => {
    if (open) {
      setPhaseName(initialData?.phase_name ?? "");
      setStartWeek(
        initialData?.start_week ? String(initialData.start_week) : "",
      );
      setEndWeek(initialData?.end_week ? String(initialData.end_week) : "");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!phaseName.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        phase_name: phaseName.trim(),
        start_week: startWeek ? Number(startWeek) : undefined,
        end_week: endWeek ? Number(endWeek) : undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initialData;

  // Filter end weeks to be >= start week
  const startWeekNum = startWeek ? Number(startWeek) : null;
  const endWeekOptions = startWeekNum
    ? weeks.filter((w) => w.value >= startWeekNum)
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
                      value={String(w.value)}
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
                      value={String(w.value)}
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
