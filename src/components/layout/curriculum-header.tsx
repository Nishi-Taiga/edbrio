"use client";

import { useAuth } from "@/hooks/use-auth";
import { EdBrioLogo } from "@/components/ui/edbrio-logo";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function CurriculumHeader() {
  const { dbUser, signOut } = useAuth();
  const t = useTranslations("curriculum.header");

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-2.5">
        <EdBrioLogo size={28} />
        <span className="text-lg font-bold text-foreground">{t("title")}</span>
      </div>
      <div className="flex items-center gap-3">
        {dbUser && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {dbUser.name}
          </span>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
          aria-label={t("logout")}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t("logout")}</span>
        </button>
      </div>
    </header>
  );
}
