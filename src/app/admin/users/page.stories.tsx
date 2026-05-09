import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import UsersPage from "./page";

const meta = {
  title: "Pages/Admin/Users",
  component: UsersPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof UsersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
