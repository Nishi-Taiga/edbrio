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

interface TestGroup {
  key: string;
  test_name: string;
  test_type: string;
  test_date: string;
  scores: TestScore[];
  totalScore: number;
  totalMax: number;
}

export function TestScoreList({
  scores,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
  t,
}: TestScoreListProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Group scores by test_name + test_date
  const groups = useMemo(() => {
    const map = new Map<string, TestGroup>();
    for (const s of scores) {
      const key = `${s.test_name}__${s.test_date}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          test_name: s.test_name,
          test_type: s.test_type,
          test_date: s.test_date,
          scores: [],
          totalScore: 0,
          totalMax: 0,
        });
      }
      const g = map.get(key)!;
      g.scores.push(s);
      g.totalScore += s.score;
      g.totalMax += s.max_score;
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
    );
  }, [scores]);

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="w-8 py-2 px-1"></th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testDate")}
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testName")}
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testType")}
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    {t("testScore")}
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    科目数
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const isExpanded = expandedKey === group.key;
                  return (
                    <GroupRow
                      key={group.key}
                      group={group}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedKey(isExpanded ? null : group.key)
                      }
                      onEdit={onEdit}
                      onDelete={onDelete}
                      readOnly={readOnly}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GroupRow({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  readOnly,
}: {
  group: TestGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (score: TestScore) => void;
  onDelete: (id: string) => Promise<void>;
  readOnly: boolean;
}) {
  return (
    <>
      {/* Summary row */}
      <tr
        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-2.5 px-1 text-center">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground inline" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground inline" />
          )}
        </td>
        <td className="py-2.5 px-2 whitespace-nowrap">
          {format(new Date(group.test_date), "M/d")}
        </td>
        <td className="py-2.5 px-2 font-semibold">{group.test_name}</td>
        <td className="py-2.5 px-2">
          <Badge variant="outline">
            {testTypeLabel[group.test_type] || group.test_type}
          </Badge>
        </td>
        <td className="py-2.5 px-2 text-right font-mono">
          {group.totalScore}
          <span className="text-muted-foreground">/{group.totalMax}</span>
        </td>
        <td className="py-2.5 px-2 text-right text-muted-foreground">
          {group.scores.length}科目
        </td>
      </tr>

      {/* Expanded detail rows */}
      {isExpanded &&
        group.scores
          .sort((a, b) => a.subject.localeCompare(b.subject))
          .map((score) => (
            <tr
              key={score.id}
              className="border-b bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <td className="py-1.5 px-1"></td>
              <td className="py-1.5 px-2"></td>
              <td className="py-1.5 px-2 text-muted-foreground text-xs pl-6">
                {score.subject}
              </td>
              <td className="py-1.5 px-2"></td>
              <td className="py-1.5 px-2 text-right font-mono text-xs">
                {score.score}
                <span className="text-muted-foreground">
                  /{score.max_score}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-xs text-muted-foreground">
                {score.percentile ? `偏${score.percentile.toFixed(1)}` : ""}
              </td>
              {!readOnly && (
                <td className="py-1.5 px-2">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(score);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(score.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
    </>
  );
}
