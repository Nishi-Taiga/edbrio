import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BookingsPage from "./page";

const meta = {
  title: "Pages/Guardian/Bookings",
  component: BookingsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BookingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
