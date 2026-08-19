import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // The set-state-in-effect rule is new in React 19 / eslint-plugin-react-hooks.
  // Every existing occurrence is a valid pattern (loading state before an async
  // call, `setMounted(true)` for SSR hydration guards, etc.), so suppress it
  // project-wide rather than sprinkling dozens of inline disables.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Compiled JavaScript. Linting the output of tsc is slow enough to look
    // like a hang and tells you nothing the source did not.
    "microservices/*/dist/**",
    "microservices/shared/test-build/**",
    "**/tsconfig.tsbuildinfo",

    // The Express services are checked by `npm run typecheck:services`.
    // eslint-config-next's rules are about React and Next pages, so pointing
    // them at seven Node services produces noise, not findings -- and walking
    // the whole tree is slow enough to look like a hang.
    "microservices/**",

    // Anything staged for manual deletion (device tooling cannot remove files).
    "_to_delete/**",
    "**/_to_delete/**",
  ]),

]);

export default eslintConfig;
