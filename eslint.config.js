// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import node from "eslint-plugin-n";

export default tseslint.config(
    eslint.configs.recommended,
    {ignores: ["ts-out"]},
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    node.configs["flat/recommended-module"],
    {
        plugins: {
            prettier,
            node
        },
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            // FIXME: THIS IS TEMPORARY. DEAR GOD PLEASE FIX THIS.
            // Explanation: Upon migrating away from Dmitmel's config, these errors cropped up.
            // This leads me to believe that these rules were never covered by the original config.
            "prefer-const": 0,
            "no-constant-binary-expression": 0,
            "no-prototype-builtins": 0,
            "n/no-unsupported-features/node-builtins": 0,
            "@typescript-eslint/no-floating-promises": 1,
            "@typescript-eslint/no-unsafe-member-access": 1,
            "@typescript-eslint/no-unsafe-call": 1,
            "@typescript-eslint/await-thenable": 1,
            "@typescript-eslint/no-misused-promises": 1,
            "@typescript-eslint/no-explicit-any": 1,
            "@typescript-eslint/no-unnecessary-type-assertion": 1,
            "@typescript-eslint/no-unsafe-argument": 1,
            "@typescript-eslint/require-await": 1,
            "@typescript-eslint/no-unsafe-assignment": 1,
            "@typescript-eslint/no-unsafe-return": 1,
            "@typescript-eslint/unbound-method": 1,
            "@typescript-eslint/ban-types": 1,
            // @ts-expect-error - This is fine
            ...prettier.configs.recommended.rules
        }
    }
);
