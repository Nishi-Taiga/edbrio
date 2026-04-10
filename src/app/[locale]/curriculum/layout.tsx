"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { CurriculumHeader } from "@/components/layout/curriculum-header";

export default function CurriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public routes: login and share pages don't require authentication
  const isPublic =
    pathname?.includes("/curriculum/login") ||
    pathname?.includes("/curriculum/share/");

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={["school"]} redirectTo="/curriculum/login">
      <CurriculumHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </ProtectedRoute>
  );
}
