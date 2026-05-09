import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import GuardianDashboard from "./page";

const meta = {
  title: "Pages/Guardian/Dashboard",
  component: GuardianDashboard,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GuardianDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
