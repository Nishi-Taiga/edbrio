import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: "school",
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user && !data.user.email_confirmed_at) {
    return NextResponse.json({ needsConfirmation: true });
  }

  return NextResponse.json({ role: "school" });
}
