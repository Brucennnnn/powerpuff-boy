import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
// Optional: import globals if you need to define global variables (e.g., for browser, node)
// import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // Recommended: Helps FlatCompat find plugins used by the extended configs
  // resolvePluginsRelativeTo: __dirname,
});

// Define the configuration array
const eslintConfig = [
  // --- IGNORES CONFIGURATION OBJECT ---
  // It's common practice to put global ignores in their own object,
  // often at the beginning of the array.
  {
    ignores: [
      ".next/**/*",        // <--- Ignore the Next.js build directory
      "node_modules/**/*", // Standard practice: ignore dependencies
      "dist/**/*",         // Common build output directory
      "build/**/*",        // Another common build output directory
      "out/**/*",          // Next.js static export directory
      // Add any other directories or specific files you want ESLint to skip
    ],
  },

  // --- YOUR EXISTING COMPATIBILITY CONFIGS ---
  // These apply the rules from the Next.js presets
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // --- OPTIONAL: ADD MORE CUSTOM RULES/OVERRIDES HERE ---
  // You can add more configuration objects for specific file types or rules
  // Example: Overriding a rule from the presets
  // {
  //   files: ["src/**/*.ts?(x)"], // Target specific files
  //   rules: {
  //     "@typescript-eslint/no-explicit-any": "warn", // Change severity or disable
  //   }
  // }
  // Example: Setting up globals (if not handled by presets)
  // {
  //   languageOptions: {
  //     globals: {
  //       ...globals.browser,
  //       ...globals.node,
  //     }
  //   }
  // }
];

export default eslintConfig;
