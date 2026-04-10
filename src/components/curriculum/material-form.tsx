"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (material: {
    material_name: string;
    subject: string;
    notes?: string;
  }) => Promise<void>;
  initialData?: { material_name: string; subject: string; notes?: string };
  existingSubjects?: string[];
  t: (key: string) => string;
}

export function MaterialForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  existingSubjects,
  t,
}: MaterialFormProps) {
  const [materialName, setMaterialName] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMaterialName(initialData?.material_name ?? "");
      setSubject(initialData?.subject ?? "");
      setNotes(initialData?.notes ?? "");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!materialName.trim() || !subject.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        material_name: materialName.trim(),
        subject: subject.trim(),
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initialData?.material_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editMaterial") : t("addMaterial")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("editMaterialDescription")
              : t("addMaterialDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="material-name">{t("materialName")}</Label>
            <Input
              id="material-name"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder={t("materialNamePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="material-subject">{t("subject")}</Label>
            {existingSubjects && existingSubjects.length > 0 ? (
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("subjectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {existingSubjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="material-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("subjectPlaceholder")}
                className="mt-1"
              />
            )}
          </div>
          <div>
            <Label htmlFor="material-notes">{t("notes")}</Label>
            <Textarea
              id="material-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
            />
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
          <Button
            onClick={handleSubmit}
            disabled={saving || !materialName.trim() || !subject.trim()}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t("save") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
