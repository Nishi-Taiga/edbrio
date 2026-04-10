"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, LinkIcon, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  studentName: string;
}

export function ShareLinkDialog({
  open,
  onOpenChange,
  profileId,
  studentName,
}: ShareLinkDialogProps) {
  const t = useTranslations("curriculum.share");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const shareUrl = token
    ? `${window.location.origin}/curriculum/share/${token}`
    : null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/curriculum/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("generateFailed"));
        return;
      }
      setToken(data.token);
    } catch {
      toast.error(t("generateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t("copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!token) return;
    setRevoking(true);
    try {
      const res = await fetch("/api/curriculum/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        toast.error(t("revokeFailed"));
        return;
      }
      setToken(null);
      toast.success(t("revoked"));
    } catch {
      toast.error(t("revokeFailed"));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setToken(null);
          setCopied(false);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", { name: studentName })}
          </DialogDescription>
        </DialogHeader>

        {!token ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <p className="text-sm text-muted-foreground text-center">
              {t("generateHint")}
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <LinkIcon className="w-4 h-4 mr-2" />
              {t("generateButton")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={shareUrl || ""}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label={t("copyButton")}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("readOnlyHint")}</p>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {t("revokeHint")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleRevoke}
                disabled={revoking}
              >
                {revoking ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                )}
                {t("revokeButton")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
