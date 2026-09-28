import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    // Migrations appliquées une seule fois avant tous les tests (tests d'intégration).
    globalSetup: ["./tests/setup/migrations.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
