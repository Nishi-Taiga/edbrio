import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PricingPage from "./page";

const meta = {
  title: "Pages/Public/Pricing",
  component: PricingPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PricingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
