"use client";

import { EdBrioLogo } from "@/components/ui/edbrio-logo";
import { CurriculumAuthForm } from "@/components/auth/curriculum-auth-form";

export default function CurriculumLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2.5 mb-8">
        <EdBrioLogo size={40} />
        <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
          EdBrio
        </span>
      </div>
      <CurriculumAuthForm />
    </div>
  );
}
