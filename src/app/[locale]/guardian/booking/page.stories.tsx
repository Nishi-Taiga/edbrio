import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BookingPage from "./page";

const meta = {
  title: "Pages/Guardian/Booking",
  component: BookingPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BookingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
