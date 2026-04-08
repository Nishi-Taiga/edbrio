import type { StorybookConfig } from "@storybook/nextjs-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const mockDir = path.join(dirname, "mocks");

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  viteFinal: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Mock hooks
      "@/hooks/use-auth": path.join(mockDir, "use-auth.ts"),
      "@/hooks/use-bookings": path.join(mockDir, "use-bookings.ts"),
      "@/hooks/use-reports": path.join(mockDir, "use-reports.ts"),
      "@/hooks/use-tickets": path.join(mockDir, "use-tickets.ts"),
      "@/hooks/use-unread-count": path.join(mockDir, "use-unread-count.ts"),
      "@/hooks/use-booking-reports": path.join(
        mockDir,
        "use-booking-reports.ts",
      ),
      // Mock Supabase client
      "@/lib/supabase/client": path.join(mockDir, "supabase-client.ts"),
      // Mock ProtectedRoute (pass-through)
      "@/components/layout/protected-route": path.join(
        mockDir,
        "protected-route.tsx",
      ),
      // Mock next-intl navigation
      "@/i18n/navigation": path.join(mockDir, "navigation.ts"),
      // Mock analytics
      "@/lib/analytics": path.join(mockDir, "analytics.ts"),
    };
    return config;
  },
};
export default config;
