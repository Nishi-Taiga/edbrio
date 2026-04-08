import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import messages from "../messages/ja.json";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";
      return (
        <NextIntlClientProvider locale="ja" messages={messages}>
          <SidebarProvider>
            <div className={theme === "dark" ? "dark" : ""}>
              <div
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  minHeight: "100vh",
                }}
              >
                <Story />
              </div>
            </div>
          </SidebarProvider>
        </NextIntlClientProvider>
      );
    },
  ],
};

export default preview;
