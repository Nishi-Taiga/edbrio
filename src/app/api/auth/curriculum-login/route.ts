import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkLoginLock,
  recordLoginFailure,
  clearLoginAttempts,
} from "@/lib/supabase/middleware";
import { createRateLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const loginRateLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const { success: rateLimitOk } = loginRateLimiter.check(ip);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてからお試しください。" },
      { status: 429 },
    );
  }

  const body = await req.json();
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードを入力してください。" },
      { status: 400 },
    );
  }
  const { email, password } = result.data;

  const lockKey = email.toLowerCase();
  const { locked } = checkLoginLock(lockKey);
  if (locked) {
    return NextResponse.json(
      {
        error: "アカウントがロックされています。30分後に再度お試しください。",
      },
      { status: 423 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const { locked: nowLocked } = recordLoginFailure(lockKey);
    const message = nowLocked
      ? "ログイン試行回数の上限に達しました。アカウントが30分間ロックされます。"
      : "メールアドレスまたはパスワードが正しくありません。";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  clearLoginAttempts(lockKey);

  // Verify role is school
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = dbUser?.role || data.user.user_metadata?.role;

  if (role !== "school") {
    // Sign out — this login page is school-only
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "このログイン画面は学校アカウント専用です。" },
      { status: 403 },
    );
  }

  return NextResponse.json({ role });
}
