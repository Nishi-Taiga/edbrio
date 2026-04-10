import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CurriculumDetailPage from "./page";

const meta = {
  title: "Pages/Teacher/Curriculum/Detail",
  component: CurriculumDetailPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/teacher/curriculum/profile-001",
        segments: [["profileId", "profile-001"]],
      },
    },
  },
} satisfies Meta<typeof CurriculumDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
