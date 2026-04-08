import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoadingButton } from "@/components/ui/loading-button";

const meta = {
  title: "UI/LoadingButton",
  component: LoadingButton,
  tags: ["autodocs"],
  argTypes: {
    loading: { control: "boolean" },
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof LoadingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "保存する", loading: false },
};

export const Loading: Story = {
  args: { children: "保存中...", loading: true },
};

export const DestructiveLoading: Story = {
  args: { children: "削除中...", loading: true, variant: "destructive" },
};

export const States: Story = {
  render: () => (
    <div className="flex gap-3">
      <LoadingButton loading={false}>保存する</LoadingButton>
      <LoadingButton loading={true}>保存中...</LoadingButton>
      <LoadingButton disabled>無効</LoadingButton>
    </div>
  ),
};
