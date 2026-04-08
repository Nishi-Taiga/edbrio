import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TicketsPage from "./page";

const meta = {
  title: "Pages/Guardian/Tickets",
  component: TicketsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TicketsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
