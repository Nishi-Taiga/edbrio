import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import NewReportPage from "./page";

const meta = {
  title: "Pages/Teacher/Reports/New",
  component: NewReportPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/teacher/reports/new", query: {} },
    },
  },
} satisfies Meta<typeof NewReportPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
