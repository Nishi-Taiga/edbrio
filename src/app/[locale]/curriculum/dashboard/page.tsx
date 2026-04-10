"use client";

import { useAuth } from "@/hooks/use-auth";
import { useStudentProfiles } from "@/hooks/use-student-profiles";
import { StudentListView } from "@/components/curriculum/student-list-view";

export default function CurriculumDashboardPage() {
  const { user } = useAuth();
  const { profiles, loading, error, createProfile } = useStudentProfiles(
    user?.id,
  );

  return (
    <StudentListView
      profiles={profiles}
      loading={loading}
      error={error}
      createProfile={createProfile}
      basePath="/curriculum"
    />
  );
}
