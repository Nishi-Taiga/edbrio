import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CalendarPage from "./page";

const meta = {
  title: "Pages/Teacher/Calendar",
  component: CalendarPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CalendarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
