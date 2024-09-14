// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    {ignores: ["ts-out", "src/discord/content/js", "*.config.js", "src/shelter/", "scripts/"]},
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            "no-constant-binary-expression": 0,
            "@typescript-eslint/no-unused-vars": [
                2,
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ]
        }
    }
);
