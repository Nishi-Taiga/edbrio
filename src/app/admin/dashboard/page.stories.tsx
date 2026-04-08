import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AdminDashboard from "./page";

const meta = {
  title: "Pages/Admin/Dashboard",
  component: AdminDashboard,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AdminDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
