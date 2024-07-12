// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import n from "eslint-plugin-n";

export default tseslint.config(
    eslint.configs.recommended,
    {ignores: ["ts-out", "src/discord/content/js"]},
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
            "n/no-unpublished-import": 0,
            "n/no-unsupported-features/node-builtins": 1,
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
