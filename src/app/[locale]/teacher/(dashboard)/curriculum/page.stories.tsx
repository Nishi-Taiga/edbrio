import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CurriculumPage from "./page";

const meta = {
  title: "Pages/Teacher/Curriculum",
  component: CurriculumPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CurriculumPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
