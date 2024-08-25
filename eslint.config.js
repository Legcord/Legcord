// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
    eslint.configs.recommended,
    {ignores: ["ts-out", "src/discord/content/js", "*.config.js", "src/shelter/", "scripts/"]},
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    n.configs["flat/recommended"],
    prettier,
    {
        settings: {
            n: {
                allowModules: ["electron"],
                tryExtensions: [".tsx", ".ts", ".jsx", ".js", ".json", ".node", ".d.ts"]
            }
        },
        plugins: {
            n
        },
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
            ],
            "@typescript-eslint/no-misused-promises": [
                2,
                {
                    checksVoidReturn: false
                }
            ]
        }
    }
);
