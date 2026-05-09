import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ReportDetailPage from "./page";

const meta = {
  title: "Pages/Teacher/Reports/Detail",
  component: ReportDetailPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/teacher/reports/report-001",
        segments: [["reportId", "report-001"]],
      },
    },
  },
} satisfies Meta<typeof ReportDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
