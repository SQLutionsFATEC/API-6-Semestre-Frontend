import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    testTimeout: 15000,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "**/*.test.{js,jsx}",
        "**/*.spec.{js,jsx}",
        "src/main.jsx",
        "src/setupTests.js",
      ],
    },
  },
});
