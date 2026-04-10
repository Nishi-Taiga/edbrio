import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InvitePage from "./page";

const meta = {
  title: "Pages/Public/Invite",
  component: InvitePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/invite/test-token",
        segments: [["token", "test-token-123"]],
      },
    },
  },
} satisfies Meta<typeof InvitePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
