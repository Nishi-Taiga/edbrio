import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TeacherDashboard from "./page";

const meta = {
  title: "Pages/Teacher/Dashboard",
  component: TeacherDashboard,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TeacherDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
