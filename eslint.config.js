/* eslint-disable n/no-unpublished-import */
// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import n from "eslint-plugin-n";

export default tseslint.config(
    eslint.configs.recommended,
    {ignores: ["ts-out", "src/discord/content/js"]}, // REVIEW - investigate discord files a bit before finalizing this - I think these are meant to be run in the app console, and this would be difficult to type
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    n.configs["flat/recommended"],
    {
        settings: {
            n: {
                allowModules: ["electron"],
                tryExtensions: [".tsx", ".ts", ".jsx", ".js", ".json", ".node", ".d.ts"]
            }
        },
        plugins: {
            prettier,
            n
        },
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rules: {
            "no-constant-binary-expression": 0,
            "n/no-unsupported-features/node-builtins": 1,
            "@typescript-eslint/no-unused-vars": [
                2,
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ],
            // @ts-expect-error - Don't worry about it
            ...prettier.configs.recommended.rules
        }
    }
);
