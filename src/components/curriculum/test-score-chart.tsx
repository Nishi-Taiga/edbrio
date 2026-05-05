"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { TestScore, ExamSchedule, TestType } from "@/lib/types/database";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { getSubjectColor } from "@/components/curriculum/gantt-chart";

interface TestScoreChartProps {
  scores: TestScore[];
  exams?: ExamSchedule[];
  t: (key: string) => string;
  onScoreClick?: (scoreId: string) => void;
}

const TEST_TYPE_LABELS: Record<TestType, string> = {
  school_exam: "定期テスト",
  mock_exam: "模試",
  quiz: "小テスト",
  entrance_exam: "入試",
  other: "その他",
};

type ViewMode = "score" | "deviation";

const ENTRANCE_CATEGORIES = new Set([
  "recommendation",
  "common_test",
  "general",
]);

const KANJI_NUMBERS = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload, dataKey, onScoreClick } = props;
  if (cx == null || cy == null) return null;
  const scoreId = payload?.[`_id_${dataKey}`];
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={props.stroke}
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: scoreId && onScoreClick ? "pointer" : "default" }}
      onClick={() => {
        if (scoreId && onScoreClick) onScoreClick(scoreId);
      }}
    />
  );
}

export function TestScoreChart({
  scores,
  exams,
  t,
  onScoreClick,
}: TestScoreChartProps) {
  const availableTypes = useMemo(
    () =>
      (
        [
          "school_exam",
          "mock_exam",
          "quiz",
          "entrance_exam",
          "other",
        ] as TestType[]
      ).filter((type) => scores.some((s) => s.test_type === type)),
    [scores],
  );

  const [selectedType, setSelectedType] = useState<TestType | "">("");
  const activeType = (selectedType || availableTypes[0]) as
    | TestType
    | undefined;

  // Deviation mode only available when scores have percentile data
  const hasDeviation = useMemo(
    () =>
      scores.some((s) => s.test_type === activeType && s.percentile != null),
    [scores, activeType],
  );
  const [viewMode, setViewMode] = useState<ViewMode>("score");
  const effectiveViewMode = hasDeviation ? viewMode : "score";
  const [showBorderLines, setShowBorderLines] = useState(true);
  const [showMainOnly, setShowMainOnly] = useState(false);

  // Border lines from entrance exams
  const borderLines = useMemo(() => {
    if (!exams || effectiveViewMode !== "deviation") return [];
    return exams
      .filter(
        (e) =>
          ENTRANCE_CATEGORIES.has(e.exam_category) &&
          e.border_score != null &&
          e.border_score_type === "deviation",
      )
      .sort((a, b) => (a.preference_order ?? 999) - (b.preference_order ?? 999))
      .map((e) => {
        const order = e.preference_order;
        const orderLabel =
          order != null && order >= 1 && order <= 10
            ? `第${KANJI_NUMBERS[order - 1]}志望`
            : order != null
              ? `第${order}志望`
              : "志望校";
        return {
          name: e.exam_name,
          label: `${orderLabel} ${e.exam_name} (偏差値${e.border_score})`,
          value: e.border_score!,
          order,
        };
      });
  }, [exams, effectiveViewMode]);

  const { chartData, subjects } = useMemo(() => {
    if (!activeType) return { chartData: [], subjects: [] };

    const filtered = scores.filter(
      (s) => s.test_type === activeType && (!showMainOnly || s.is_main_subject),
    );
    if (filtered.length === 0) return { chartData: [], subjects: [] };

    const subjectSet = new Set(filtered.map((s) => s.subject));
    const subjects = Array.from(subjectSet);

    const dateMap = new Map<string, Record<string, number | string>>();
    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(a.test_date).getTime() - new Date(b.test_date).getTime(),
    );

    sorted.forEach((score) => {
      const dateKey = score.test_date;
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, {});
      const entry = dateMap.get(dateKey)!;
      if (effectiveViewMode === "deviation" && score.percentile != null) {
        entry[score.subject] = score.percentile;
      } else {
        entry[score.subject] = score.score;
      }
      entry[`_id_${score.subject}`] = score.id;
    });

    const chartData = Array.from(dateMap.entries()).map(([date, values]) => ({
      date: format(new Date(date), "M/d"),
      ...values,
    }));

    return { chartData, subjects };
  }, [scores, activeType, effectiveViewMode, showMainOnly]);

  const handleDotClick = useCallback(
    (scoreId: string) => {
      onScoreClick?.(scoreId);
    },
    [onScoreClick],
  );

  if (scores.length === 0) return null;

  const yLabel = effectiveViewMode === "deviation" ? "偏差値" : "得点";
  const yDomain: [number, number] =
    effectiveViewMode === "deviation" ? [30, 80] : [0, 100];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5" />
            {t("testChartTitle")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* 主要5教科フィルター — 模試は主要教科のみのため非表示 */}
            {activeType !== "mock_exam" && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showMainOnly}
                  onChange={(e) => setShowMainOnly(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                主要5教科
              </label>
            )}
            {/* Score / Deviation toggle — 常に左側に固定表示（スペース確保） */}
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("score")}
                disabled={!hasDeviation}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  effectiveViewMode === "score"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-default"
                }`}
              >
                得点
              </button>
              <button
                onClick={() => setViewMode("deviation")}
                disabled={!hasDeviation}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  effectiveViewMode === "deviation"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-default"
                }`}
              >
                偏差値
              </button>
            </div>
            {/* Test type filter */}
            <Select
              value={activeType || ""}
              onValueChange={(v) => setSelectedType(v as TestType)}
            >
              <SelectTrigger
                className="w-[140px] h-8 text-xs"
                aria-label="テスト種類"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TEST_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 志望校ライン表示切替 — グラフ右下にオーバーレイ */}
        <div className="relative">
          {effectiveViewMode === "deviation" && borderLines.length > 0 && (
            <label className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border">
              <input
                type="checkbox"
                checked={showBorderLines}
                onChange={(e) => setShowBorderLines(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              志望校ラインを表示
            </label>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis
                domain={yDomain}
                className="text-xs"
                label={{
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#9CA3AF" },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) =>
                  effectiveViewMode === "deviation"
                    ? `${Number(value).toFixed(1)}`
                    : `${Number(value).toFixed(0)}点`
                }
              />
              <Legend />
              {/* Border lines for entrance exams */}
              {showBorderLines &&
                borderLines.map((bl, i) => (
                  <ReferenceLine
                    key={`border-${i}`}
                    y={bl.value}
                    stroke="#EF4444"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{
                      value: bl.label,
                      position: "insideTopRight",
                      fill: "#EF4444",
                      fontSize: 10,
                    }}
                  />
                ))}
              {subjects.map((subject) => {
                const subjectColor = getSubjectColor(subject);
                return (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={subjectColor.color}
                    strokeWidth={2}
                    dot={<CustomDot onScoreClick={handleDotClick} />}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                    name={subject}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
