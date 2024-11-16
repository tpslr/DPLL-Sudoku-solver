// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import stylisticJs from "@stylistic/eslint-plugin-js";


export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    stylisticJs.configs["all-flat"],
    stylisticJs.configs["disable-legacy"],
    {
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.node,
        }
    },
    {
        ignores: ["dist/**"]
    },
    {
        rules: {
            "@stylistic/js/quote-props": "off",
            "@stylistic/js/comma-dangle": "off",
            "@stylistic/js/space-before-function-paren": "off",
            "@stylistic/js/padded-blocks": "off",
            "@stylistic/js/function-call-argument-newline": "off",
            "@stylistic/js/no-trailing-spaces": "off",
            "@stylistic/js/object-curly-spacing": "off",
            "@stylistic/js/array-element-newline": "off",
            "@stylistic/js/arrow-parens": "off",
            "@stylistic/js/function-paren-newline": "off",
        }
    }
);
