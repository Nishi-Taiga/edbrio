"use client";

import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { StudentProfile } from "@/lib/types/database";
import { useTranslations } from "next-intl";

interface StudentCardProps {
  profile: StudentProfile;
}

export function StudentCard({ profile }: StudentCardProps) {
  const t = useTranslations("curriculum");
  const router = useRouter();

  return (
    <tr
      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => router.push(`/teacher/curriculum/${profile.id}`)}
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
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </td>
    </tr>
  );
}
