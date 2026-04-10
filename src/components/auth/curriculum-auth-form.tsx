"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function CurriculumAuthForm() {
  const t = useTranslations("curriculum.login");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === "signup" && !name.trim()) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/curriculum-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t("loginFailed"));
          return;
        }
        // Set client session
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        router.replace("/curriculum/dashboard");
      } else {
        const res = await fetch("/api/auth/curriculum-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: name.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t("signupFailed"));
          return;
        }
        if (data.needsConfirmation) {
          setMessage(t("confirmationSent"));
          return;
        }
        // Auto-confirmed — sign in and redirect
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        router.replace("/curriculum/dashboard");
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">
          {isLogin ? t("title") : t("signupTitle")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isLogin ? t("description") : t("signupDescription")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="p-3 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg text-green-700 dark:text-green-400"
              role="status"
            >
              {message}
            </div>
          )}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="curriculum-name">{t("name")}</Label>
              <Input
                id="curriculum-name"
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="curriculum-email">{t("email")}</Label>
            <Input
              id="curriculum-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="curriculum-password">{t("password")}</Label>
            <Input
              id="curriculum-password"
              type="password"
              placeholder={!isLogin ? t("passwordHint") : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={!isLogin ? 8 : undefined}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !email.trim() ||
              !password ||
              (!isLogin && !name.trim())
            }
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLogin ? t("loginButton") : t("signupButton")}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? t("noAccount") : t("hasAccount")}{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={() => {
              setMode(isLogin ? "signup" : "login");
              setError("");
              setMessage("");
            }}
          >
            {isLogin ? t("signupLink") : t("loginLink")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
