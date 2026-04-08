import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SettingsPage from "./page";

const meta = {
  title: "Pages/Guardian/Settings",
  component: SettingsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
