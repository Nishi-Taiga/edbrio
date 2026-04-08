import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "確定" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "確認待ち" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "キャンセル" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "下書き" },
};

export const BookingStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">確認待ち</Badge>
      <Badge variant="default">確定</Badge>
      <Badge variant="destructive">キャンセル</Badge>
      <Badge variant="outline">完了</Badge>
    </div>
  ),
};

export const ReportStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">下書き</Badge>
      <Badge variant="default">公開</Badge>
    </div>
  ),
};
