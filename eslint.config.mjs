import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Pages and components may only import content from the "@/content" barrel —
  // never raw JSON (@content/*) or internal content modules (@/content/*).
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@content/*"],
              message:
                "Import data via loaders from '@/content', never raw JSON (@content/*).",
            },
            {
              group: ["@/content/*"],
              message: "Import from the '@/content' barrel only, not its internals.",
            },
          ],
        },
      ],
    },
  },
  // The content layer, scripts and tests are allowed to reach into internals.
  {
    files: ["src/content/**", "scripts/**", "tests/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    // Local Playwright MCP scratch output (gitignored).
    ".playwright-mcp/**",
    // Local copy of the old npm-installed tree (gitignored).
    "node_modules.npm-backup/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
