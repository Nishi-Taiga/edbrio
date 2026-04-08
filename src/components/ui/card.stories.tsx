import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>カードタイトル</CardTitle>
        <CardDescription>カードの説明文がここに入ります。</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">コンテンツエリア</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>設定</CardTitle>
        <CardDescription>アカウント設定を変更します。</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          メール通知を有効にすると、予約の確認メールが届きます。
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline">キャンセル</Button>
        <Button>保存する</Button>
      </CardFooter>
    </Card>
  ),
};

export const BookingCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">数学 - 田中太郎</CardTitle>
          <Badge>確定</Badge>
        </div>
        <CardDescription>2026年4月10日 15:00〜16:00</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">二次方程式の応用問題</p>
      </CardContent>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[200px]">
      <CardHeader className="pb-2">
        <CardDescription>今月のレッスン</CardDescription>
        <CardTitle className="text-3xl">24</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">先月比 +12%</p>
      </CardContent>
    </Card>
  ),
};
