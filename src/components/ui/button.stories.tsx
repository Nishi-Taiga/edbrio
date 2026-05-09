import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Loader2, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "保存する" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "削除する" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "キャンセル" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "編集" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "詳細を見る" },
};

export const Link: Story = {
  args: { variant: "link", children: "もっと見る" },
};

export const Small: Story = {
  args: { size: "sm", children: "追加" },
};

export const Large: Story = {
  args: { size: "lg", children: "予約する" },
};

export const Icon: Story = {
  args: { size: "icon", children: <Plus className="h-4 w-4" /> },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail className="h-4 w-4" /> メール送信
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="h-4 w-4 animate-spin" /> 保存中...
      </>
    ),
  },
};

export const Disabled: Story = {
  args: { disabled: true, children: "無効" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
};
