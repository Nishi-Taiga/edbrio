"use client";

import {
  StudentProfile,
  CurriculumMaterial,
  CurriculumPhase,
  ExamSchedule,
  PhaseTask,
} from "@/lib/types/database";
import { differenceInDays, format } from "date-fns";

// Avatar color for each student (cycle through)
const AVATAR_COLORS = [
  "#0C5394",
  "#45818E",
  "#8E7CC3",
  "#F1C232",
  "#BE123C",
  "#059669",
];

interface StudentInfoBarProps {
  profile: StudentProfile;
  materials: CurriculumMaterial[];
  phases: CurriculumPhase[];
  exams: ExamSchedule[];
  phaseTasks?: PhaseTask[];
  colorIndex?: number;
}

export function StudentInfoBar({
  profile,
  exams,
  colorIndex = 0,
}: StudentInfoBarProps) {
  const today = new Date();
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

  const futureExams = exams
    .filter((e) => new Date(e.exam_date) >= today)
    .sort(
      (a, b) =>
        new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime(),
    );
  const nextExam = futureExams[0] ?? null;
  const daysUntilNext = nextExam
    ? differenceInDays(new Date(nextExam.exam_date), today)
    : null;
  const firstChoice = futureExams.find((e) => e.preference_order === 1);
  const daysUntilFirst = firstChoice
    ? differenceInDays(new Date(firstChoice.exam_date), today)
    : null;

  const nameInitial = profile.name[0] || "?";
  const metaParts: string[] = [];
  if (profile.curriculum_year) metaParts.push(`${profile.curriculum_year}年度`);
  if (profile.grade) metaParts.push(profile.grade);
  const metaText = metaParts.join(" ・ ");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl bg-[#2D1B4E] dark:bg-[#1A1230] px-4 sm:px-6 py-4 w-full">
      {/* Left: Avatar + Name */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{
            background: `linear-gradient(180deg, ${avatarColor} 0%, ${avatarColor}99 100%)`,
          }}
        >
          {nameInitial}
        </div>
        <div className="min-w-0">
          <div className="text-white font-bold text-lg leading-tight truncate">
            {profile.name}
          </div>
          {metaText && (
            <div className="text-[#E8D5F5] text-xs mt-0.5 truncate">
              {metaText}
            </div>
          )}
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:ml-auto">
        {nextExam && daysUntilNext !== null && (
          <div className="flex flex-col items-center bg-[#362358] rounded-[10px] px-3 sm:px-5 py-2 sm:py-2.5 min-w-[80px]">
            <span className="text-[#E8D5F5] text-[10px] font-medium tracking-wider">
              次の試験
            </span>
            <span className="text-white text-sm font-bold leading-tight mt-0.5">
              {nextExam.exam_name}
            </span>
            <span className="text-[#E8D5F5] text-[10px] mt-0.5">
              ({format(new Date(nextExam.exam_date), "M/d")})
            </span>
          </div>
        )}
        {firstChoice && daysUntilFirst !== null && (
          <div className="flex flex-col items-center bg-[#362358] rounded-[10px] px-3 sm:px-5 py-2 sm:py-2.5 min-w-[56px] sm:min-w-[70px]">
            <span className="text-[#E8D5F5] text-[10px] font-medium tracking-wider">
              第一志望まで
            </span>
            <span className="text-[#F59E0B] text-[22px] font-extrabold leading-tight">
              {daysUntilFirst}日
            </span>
            <span className="text-[#E8D5F5] text-[10px] mt-0.5">
              ({Math.floor(daysUntilFirst / 7)}週)
            </span>
          </div>
        )}
        {!firstChoice && nextExam && daysUntilNext !== null && (
          <div className="flex flex-col items-center bg-[#362358] rounded-[10px] px-3 sm:px-5 py-2 sm:py-2.5 min-w-[56px] sm:min-w-[70px]">
            <span className="text-[#E8D5F5] text-[10px] font-medium tracking-wider">
              試験まで
            </span>
            <span className="text-[#F59E0B] text-[22px] font-extrabold leading-tight">
              {daysUntilNext}日
            </span>
            <span className="text-[#E8D5F5] text-[10px] mt-0.5">
              ({Math.floor(daysUntilNext / 7)}週)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
