import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TeacherReportsPage from "./page";

const meta = {
  title: "Pages/Teacher/Reports",
  component: TeacherReportsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TeacherReportsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
