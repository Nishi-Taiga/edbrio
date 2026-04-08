import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SetupPage from "./page";

const meta = {
  title: "Pages/Teacher/Setup",
  component: SetupPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SetupPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
