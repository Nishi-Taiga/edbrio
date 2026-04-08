import type { Preview } from "@storybook/nextjs-vite";
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
        <div className={theme === "dark" ? "dark" : ""}>
          <div
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              padding: "1rem",
              minHeight: "100vh",
            }}
          >
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
