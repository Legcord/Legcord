// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import n from "eslint-plugin-n";

export default tseslint.config(
    eslint.configs.recommended,
    {ignores: ["ts-out", "src/discord"]}, // investigate discord files a bit
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    n.configs["flat/recommended"],
    {
        settings: {
            n: {
                allowModules: ["electron"],
                tryExtensions: [".tsx", ".ts", ".jsx", ".js", ".json", ".node"]
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
            // FIXME: THIS IS TEMPORARY. DEAR GOD PLEASE FIX THIS.
            // Explanation: Upon migrating away from Dmitmel's config, these errors cropped up.
            // This leads me to believe that these rules were never covered by the original config.
            "prefer-const": 0,
            "no-constant-binary-expression": 0,
            "no-prototype-builtins": 0,
            "no-unused-vars": 0, // Handled by @typescript-eslint/no-unused-vars
            "n/no-unsupported-features/node-builtins": 0,
            "n/no-unpublished-import": 0, // Seems broken right now
            "@typescript-eslint/no-unused-vars": [
                2,
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ],
            "@typescript-eslint/no-unsafe-member-access": 1,
            "@typescript-eslint/no-unsafe-call": 1,
            "@typescript-eslint/no-explicit-any": 1,
            "@typescript-eslint/no-unnecessary-type-assertion": 1,
            "@typescript-eslint/no-unsafe-argument": 1,
            "@typescript-eslint/no-unsafe-assignment": 1,
            "@typescript-eslint/no-unsafe-return": 1,
            "@typescript-eslint/unbound-method": 1,
            "@typescript-eslint/ban-types": 1,
            // @ts-expect-error - Don't worry about it
            ...prettier.configs.recommended.rules
        }
    }
);
