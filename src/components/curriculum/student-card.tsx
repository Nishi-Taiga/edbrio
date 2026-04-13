"use client";

import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { StudentProfile } from "@/lib/types/database";
import { useTranslations } from "next-intl";

interface StudentCardProps {
  profile: StudentProfile;
  basePath?: string;
  onEdit?: (profile: StudentProfile) => void;
  onDelete?: (profile: StudentProfile) => void;
}

export function StudentCard({
  profile,
  basePath = "/teacher/curriculum",
  onEdit,
  onDelete,
}: StudentCardProps) {
  const t = useTranslations("curriculum");
  const router = useRouter();

  return (
    <tr
      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => router.push(`${basePath}/${profile.id}`)}
    >
      <td className="py-3 px-4 font-semibold text-foreground">
        {profile.name}
      </td>
      <td className="py-3 px-4 text-muted-foreground">
        {profile.grade || "—"}
      </td>
      <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">
        {profile.school || "—"}
      </td>
      <td className="py-3 px-4">
        <Badge
          variant={profile.status === "active" ? "default" : "secondary"}
          className="text-[10px]"
        >
          {profile.status === "active"
            ? t("card.statusActive")
            : t("card.statusInactive")}
        </Badge>
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              className="p-1 rounded hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(profile);
              }}
              aria-label={`${profile.name}を編集`}
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              className="p-1 rounded hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(profile);
              }}
              aria-label={`${profile.name}を削除`}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </td>
    </tr>
  );
}
