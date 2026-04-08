import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PaymentsPage from "./page";

const meta = {
  title: "Pages/Admin/Payments",
  component: PaymentsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PaymentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
