import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ProfilePage from "./page";

const meta = {
  title: "Pages/Teacher/Profile",
  component: ProfilePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/teacher/profile", query: {} },
    },
  },
} satisfies Meta<typeof ProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
