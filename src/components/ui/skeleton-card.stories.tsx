import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  SkeletonStatCard,
  SkeletonListCard,
  SkeletonProductCard,
  SkeletonStatsGrid,
  SkeletonList,
} from "@/components/ui/skeleton-card";

const meta = {
  title: "UI/SkeletonCard",
  component: SkeletonStatCard,
  tags: ["autodocs"],
} satisfies Meta<typeof SkeletonStatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatCard: Story = {
  render: () => <SkeletonStatCard />,
};

export const ListCard: Story = {
  render: () => <SkeletonListCard />,
};

export const ProductCard: Story = {
  render: () => <SkeletonProductCard />,
};

export const StatsGrid: Story = {
  render: () => <SkeletonStatsGrid count={4} />,
};

export const List: Story = {
  render: () => <SkeletonList count={3} />,
};
