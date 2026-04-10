"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { CurriculumHeader } from "@/components/layout/curriculum-header";

export default function CurriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["school"]} redirectTo="/curriculum/login">
      <CurriculumHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </ProtectedRoute>
  );
}
