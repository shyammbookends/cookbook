import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
  {
    // The brand wall (see src/server/public/recipes.ts): only the scoped
    // public repositories and the admin services may touch Prisma directly.
    // Pages, components and API routes must go through them.
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/brands/**/*.{ts,tsx}"],
    ignores: ["src/app/admin/**", "src/app/api/admin/**"],
    rules: {
      // allowTypeImports: type-only imports (e.g. `import type { Brand } from
      // "@/generated/prisma/client"` to type a component prop) are erased at
      // build time and carry no data-access risk, so only VALUE imports of
      // Prisma are blocked here.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/db", "@/generated/prisma*"],
              message: "Don't import Prisma directly here — use src/server/public/* (brand-scoped reads) instead.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
