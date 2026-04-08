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
      "@/hooks/use-student-profiles": path.join(
        mockDir,
        "use-student-profiles.ts",
      ),
      "@/hooks/use-shifts": path.join(mockDir, "use-shifts.ts"),
      "@/hooks/use-availability": path.join(mockDir, "use-availability.ts"),
      "@/hooks/use-curriculum-materials": path.join(
        mockDir,
        "use-curriculum-materials.ts",
      ),
      "@/hooks/use-exam-schedules": path.join(mockDir, "use-exam-schedules.ts"),
      "@/hooks/use-test-scores": path.join(mockDir, "use-test-scores.ts"),
      "@/hooks/use-ai-report": path.join(mockDir, "use-ai-report.ts"),
      "@/hooks/use-conversations": path.join(mockDir, "use-conversations.ts"),
      "@/hooks/use-messages": path.join(mockDir, "use-messages.ts"),
      // Mock Supabase client
      "@/lib/supabase/client": path.join(mockDir, "supabase-client.ts"),
      // Mock ProtectedRoute (pass-through)
      "@/components/layout/protected-route": path.join(
        mockDir,
        "protected-route.tsx",
      ),
      // Mock next-intl navigation
      "@/i18n/navigation": path.join(mockDir, "navigation.ts"),
      // Mock analytics & Stripe
      "@/lib/analytics": path.join(mockDir, "analytics.ts"),
      "@/lib/stripe": path.join(mockDir, "stripe.ts"),
    };
    return config;
  },
};
export default config;
