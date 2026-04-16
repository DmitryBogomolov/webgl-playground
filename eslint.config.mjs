import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
    globalIgnores(['./node_modules/', './dist/', './build/']),
    {
        name: 'base',
        extends: [
            js.configs.recommended,
            stylistic.configs.recommended,
        ],
        languageOptions: {
            ecmaVersion: 2018,
            sourceType: 'module',
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            '@stylistic/indent': ['error', 4],
            '@stylistic/indent-binary-ops': ['error', 4],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/quote-props': ['error', 'consistent'],
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/member-delimiter-style': ['error', {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false,
                },
                multilineDetection: 'brackets',
            }],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            '@stylistic/max-len': ['error', { code: 120 }],
        },
    },
    {
        name: 'sources',
        files: ['**/*.ts'],
        extends: [
            tseslint.configs.recommendedTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true, ignoreProperties: true }],
            '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
        },
    },
    {
        name: 'tests',
        files: ['**/*.test.ts'],
        rules: {
            '@typescript-eslint/unbound-method': 'off',
        },
    },
    {
        name: 'scripts',
        files: ['**/*.{js,mjs}'],
        languageOptions: {
            globals: {
                module: false,
                require: false,
                process: false,
                console: false,
                performance: false,
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
]);
