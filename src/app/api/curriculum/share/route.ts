import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  profileId: z.string().uuid(),
});

const deleteSchema = z.object({
  token: z.string().min(1),
});

// POST: Generate share link
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 },
    );
  }

  const { profileId } = result.data;

  // Verify the user owns this profile
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("teacher_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "プロフィールが見つかりません" },
      { status: 404 },
    );
  }

  // Check for existing active link
  const { data: existing } = await supabase
    .from("curriculum_share_links")
    .select("token")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ token: existing.token });
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString("base64url");

  const { error } = await supabase.from("curriculum_share_links").insert({
    profile_id: profileId,
    token,
    created_by: user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "リンクの作成に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ token });
}

// DELETE: Revoke share link
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json();
  const result = deleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("curriculum_share_links")
    .update({ is_active: false })
    .eq("token", result.data.token);

  if (error) {
    return NextResponse.json(
      { error: "リンクの無効化に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
