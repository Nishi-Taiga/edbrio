"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  ClipboardList,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { TestScore } from "@/lib/types/database";
import { format } from "date-fns";

interface TestScoreListProps {
  scores: TestScore[];
  onAdd: () => void;
  onEdit: (score: TestScore) => void;
  onDelete: (id: string) => Promise<void>;
  readOnly?: boolean;
  t: (key: string) => string;
}

const testTypeLabel: Record<string, string> = {
  school_exam: "定期テスト",
  mock_exam: "模試",
  quiz: "小テスト",
  entrance_exam: "入試",
  other: "その他",
};

interface ScoreGroup {
  name: string;
  testType: string;
  latestDate: string;
  items: TestScore[];
  totalScore: number;
  totalMax: number;
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-foreground";
  return "text-red-600";
}

export function TestScoreList({
  scores,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
  t,
}: TestScoreListProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups = useMemo<ScoreGroup[]>(() => {
    const map = new Map<string, TestScore[]>();
    for (const score of scores) {
      const key = score.test_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(score);
    }
    return Array.from(map.entries())
      .map(([name, items]) => {
        const sorted = [...items].sort((a, b) =>
          a.subject.localeCompare(b.subject, "ja"),
        );
        const latestDate = items.reduce(
          (latest, s) => (s.test_date > latest ? s.test_date : latest),
          items[0].test_date,
        );
        return {
          name,
          testType: items[0].test_type,
          latestDate,
          items: sorted,
          totalScore: items.reduce((sum, s) => sum + s.score, 0),
          totalMax: items.reduce((sum, s) => sum + s.max_score, 0),
        };
      })
      .sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [scores]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {t("testTitle")}
          </CardTitle>
          {!readOnly && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="w-4 h-4 mr-1" />
              {t("addTest")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("testEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const isOpen = openGroups.has(group.name);
              const avgPct =
                group.totalMax > 0
                  ? (group.totalScore / group.totalMax) * 100
                  : 0;
              return (
                <div
                  key={group.name}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  {/* Group header */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => toggleGroup(group.name)}
                  >
                    <span className="text-muted-foreground shrink-0">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                    <span className="font-semibold text-sm flex-1 min-w-0">
                      {group.name}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {format(new Date(group.latestDate), "M/d")}
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 hidden sm:flex"
                    >
                      {testTypeLabel[group.testType] || group.testType}
                    </Badge>
                    <span className="text-xs shrink-0 hidden sm:block">
                      {group.items.length}科目
                    </span>
                    <span
                      className={`text-sm font-mono font-semibold shrink-0 ${scoreColor(avgPct)}`}
                    >
                      {group.totalScore}
                      <span className="text-muted-foreground font-normal text-xs">
                        /{group.totalMax}点
                      </span>
                    </span>
                  </button>

                  {/* Expanded subject rows */}
                  {isOpen && (
                    <div className="divide-y divide-border">
                      {group.items.map((score) => {
                        const pct = (score.score / score.max_score) * 100;
                        return (
                          <div
                            key={score.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group"
                          >
                            <span className="w-4 shrink-0" />
                            <span className="text-sm flex-1 min-w-0">
                              {score.subject}
                            </span>
                            <span className="font-mono text-sm shrink-0">
                              <span className={scoreColor(pct)}>
                                {score.score}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                /{score.max_score}
                              </span>
                            </span>
                            <span className="font-mono text-xs text-muted-foreground w-12 text-right shrink-0">
                              {score.percentile
                                ? `偏差値${score.percentile.toFixed(1)}`
                                : ""}
                            </span>
                            {!readOnly && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => onEdit(score)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => onDelete(score.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
