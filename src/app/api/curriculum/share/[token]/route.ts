import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET: Validate token and return all curriculum data (public, no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Validate token
  const { data: link, error: linkError } = await supabase
    .from("curriculum_share_links")
    .select("profile_id, is_active")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "無効なリンクです" }, { status: 404 });
  }

  if (!link.is_active) {
    return NextResponse.json(
      { error: "このリンクは無効化されています" },
      { status: 410 },
    );
  }

  const profileId = link.profile_id;

  // Fetch all data for this profile
  const [profileRes, materialsRes, phasesRes, tasksRes, examsRes, scoresRes] =
    await Promise.all([
      supabase
        .from("student_profiles")
        .select("*")
        .eq("id", profileId)
        .single(),
      supabase
        .from("curriculum_materials")
        .select("*")
        .eq("profile_id", profileId)
        .order("order_index"),
      supabase
        .from("curriculum_phases")
        .select("*")
        .in(
          "material_id",
          (
            await supabase
              .from("curriculum_materials")
              .select("id")
              .eq("profile_id", profileId)
          ).data?.map((m: { id: string }) => m.id) ?? [],
        )
        .order("order_index"),
      supabase
        .from("phase_tasks")
        .select("*")
        .in(
          "phase_id",
          (
            await supabase
              .from("curriculum_phases")
              .select("id")
              .in(
                "material_id",
                (
                  await supabase
                    .from("curriculum_materials")
                    .select("id")
                    .eq("profile_id", profileId)
                ).data?.map((m: { id: string }) => m.id) ?? [],
              )
          ).data?.map((p: { id: string }) => p.id) ?? [],
        ),
      supabase
        .from("exam_schedules")
        .select("*")
        .eq("profile_id", profileId)
        .order("exam_date"),
      supabase
        .from("test_scores")
        .select("*")
        .eq("profile_id", profileId)
        .order("test_date", { ascending: false }),
    ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json(
      { error: "プロフィールが見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    profile: profileRes.data,
    materials: materialsRes.data ?? [],
    phases: phasesRes.data ?? [],
    phaseTasks: tasksRes.data ?? [],
    exams: examsRes.data ?? [],
    scores: scoresRes.data ?? [],
  });
}
