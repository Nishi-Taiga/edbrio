import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LoginPage from "./page";

const meta = {
  title: "Pages/Login",
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/login",
        query: {},
      },
    },
  },
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SignupMode: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/login",
        query: { mode: "signup" },
      },
    },
  },
};
