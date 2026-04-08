import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ChatPage from "./page";

const meta = {
  title: "Pages/Guardian/Chat",
  component: ChatPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChatPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
