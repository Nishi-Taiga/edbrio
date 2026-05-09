import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "テキストを入力" },
};

export const Email: Story = {
  args: { type: "email", placeholder: "example@edbrio.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "パスワード" },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "入力できません", value: "無効な入力" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">メールアドレス</Label>
      <Input type="email" id="email" placeholder="example@edbrio.com" />
    </div>
  ),
};
