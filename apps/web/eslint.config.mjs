import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/components/**",
                "@/config/**",
                "@/features/**",
                "@/lib/**",
                "@/repositories/**",
                "@/services/**",
                "@/validations/**",
                "next",
                "next/**",
                "react",
                "react/**",
                "@supabase/**",
                "@trigger.dev/**",
              ],
              message:
                "Domain code must remain independent from presentation, application and infrastructure layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/domain/**",
                "@/features/**",
                "@/repositories/**",
                "@/services/**",
                "@/config/server-env",
              ],
              message:
                "Shared components may not own business rules or import server infrastructure.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/repositories/supabase/**", "@/config/server-env"],
              message:
                "Features must call services instead of concrete repositories or server configuration.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/components/**",
                "@/features/**",
                "@/repositories/supabase/**",
                "next",
                "next/**",
                "react",
                "react/**",
              ],
              message:
                "Application services must not depend on presentation or concrete persistence adapters.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/validations/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/components/**",
                "@/features/**",
                "@/repositories/**",
                "@/services/**",
              ],
              message:
                "Validation schemas define trust boundaries and must not invoke application or infrastructure code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/domain/**", "@/repositories/**"],
              message:
                "Next.js transport code must call features or services instead of domain and repository layers directly.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
