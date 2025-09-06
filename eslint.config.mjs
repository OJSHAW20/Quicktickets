import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Enforce rel="noopener noreferrer" with target="_blank"
      'react/jsx-no-target-blank': [
        'error',
        { allowReferrer: false, enforceDynamicLinks: 'always' }
      ],
    },
  },
];

export default eslintConfig;
