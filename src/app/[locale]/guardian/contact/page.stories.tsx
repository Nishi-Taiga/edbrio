import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ContactPage from "./page";

const meta = {
  title: "Pages/Guardian/Contact",
  component: ContactPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ContactPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
