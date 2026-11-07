import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts"],
    testTimeout: 40000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@payshield/shared": path.resolve(__dirname, "./packages/shared/src"),
    },
  },
});
