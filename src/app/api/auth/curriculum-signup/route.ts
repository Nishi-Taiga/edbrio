import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const signupRateLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const { success: rateLimitOk } = signupRateLimiter.check(ip);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてからお試しください。" },
      { status: 429 },
    );
  }

  const body = await req.json();
  const result = signupSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error:
          "名前、メールアドレス、パスワード（8文字以上）を入力してください。",
      },
      { status: 400 },
    );
  }
  const { email, password, name } = result.data;

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error("curriculum-signup: admin client error:", e);
    return NextResponse.json(
      { error: "サーバー設定エラーです。管理者に連絡してください。" },
      { status: 500 },
    );
  }

  // Check if email already exists
  const { data: existingUsers } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています。" },
      { status: 409 },
    );
  }

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: "school" },
    });

  if (authError) {
    // Trigger may have failed — auth user might exist, provision manually
    if (authError.message?.includes("Database error")) {
      const { data: authUser } =
        await supabase.auth.admin.getUserByEmail(email);
      if (authUser?.user) {
        await provisionSchoolUser(supabase, authUser.user.id, email, name);
        return NextResponse.json({ role: "school" });
      }
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: "ユーザーの作成に失敗しました。" },
      { status: 500 },
    );
  }

  // Ensure public tables are provisioned (trigger may or may not have worked)
  await provisionSchoolUser(supabase, authData.user.id, email, name);

  return NextResponse.json({ role: "school" });
}

async function provisionSchoolUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  name: string,
) {
  await supabase
    .from("users")
    .upsert({ id: userId, role: "school", email, name }, { onConflict: "id" });
  await supabase.from("teachers").upsert(
    {
      id: userId,
      handle: "school-" + userId.substring(0, 8),
      subjects: [],
      grades: [],
      public_profile: {},
    },
    { onConflict: "id" },
  );
}
