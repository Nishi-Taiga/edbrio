import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PreRegisterPage from "./page";

const meta = {
  title: "Pages/Public/PreRegister",
  component: PreRegisterPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PreRegisterPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
