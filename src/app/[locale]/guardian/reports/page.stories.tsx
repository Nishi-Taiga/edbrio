import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ReportsPage from "./page";

const meta = {
  title: "Pages/Guardian/Reports",
  component: ReportsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ReportsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
