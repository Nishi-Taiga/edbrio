import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calendar, FileText, MessageSquare, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Calendar,
    title: "まだ予約がありません",
    description: "新しい予約を作成してみましょう。",
  },
};

export const WithAction: Story = {
  args: {
    icon: Users,
    title: "まだ生徒がいません",
    description: "生徒を追加して、レッスンを始めましょう。",
    action: {
      label: "生徒を追加",
      onClick: () => alert("生徒追加モーダルを開く"),
    },
  },
};

export const WithLink: Story = {
  args: {
    icon: FileText,
    title: "まだ報告書がありません",
    description: "レッスン後に報告書を作成できます。",
    action: {
      label: "報告書を作成",
      href: "/reports/new",
    },
  },
};

export const NoBookings: Story = {
  args: {
    icon: Calendar,
    title: "まだ予約がありません",
    description: "シフトを設定すると、保護者が予約できるようになります。",
    action: {
      label: "シフトを設定",
      onClick: () => alert("シフト設定画面へ"),
    },
  },
};

export const NoMessages: Story = {
  args: {
    icon: MessageSquare,
    title: "まだメッセージがありません",
    description: "保護者とのやり取りがここに表示されます。",
  },
};
