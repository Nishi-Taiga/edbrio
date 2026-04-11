"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, ClipboardList } from "lucide-react";
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

export function TestScoreList({
  scores,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
  t,
}: TestScoreListProps) {
  const sorted = [...scores].sort(
    (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
  );

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
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("testEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testDate")}
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testName")}
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testSubject")}
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                    {t("testType")}
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    {t("testScore")}
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    {t("testPercentile")}
                  </th>
                  {!readOnly && <th className="py-2 px-2"></th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((score) => {
                  const pct = (score.score / score.max_score) * 100;
                  return (
                    <tr
                      key={score.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 px-2 whitespace-nowrap">
                        {format(new Date(score.test_date), "M/d")}
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {score.test_name}
                      </td>
                      <td className="py-2 px-2">{score.subject}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">
                          {testTypeLabel[score.test_type] || score.test_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        <span
                          className={
                            pct >= 80
                              ? "text-green-600"
                              : pct >= 60
                                ? "text-foreground"
                                : "text-red-600"
                          }
                        >
                          {score.score}
                        </span>
                        <span className="text-muted-foreground">
                          /{score.max_score}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                        {score.percentile ? score.percentile.toFixed(1) : "—"}
                      </td>
                      {!readOnly && (
                        <td className="py-2 px-2">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEdit(score)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => onDelete(score.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
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
