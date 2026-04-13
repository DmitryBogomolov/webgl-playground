import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

const stylisticRules = {
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
};

const baseConfig = defineConfig({
    name: 'sources',
    extends: [
        js.configs.recommended,
        tseslint.configs.recommendedTypeChecked,
        tseslint.configs.stylisticTypeChecked,
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
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/array-type': 'off',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true, ignoreProperties: true }],
        '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
        ...stylisticRules,
    },
});

const TESTS_PATTERN = '**/*.test.ts';

export default defineConfig([
    globalIgnores(['./node_modules/', './dist/']),
    {
        name: 'sources',
        files: ['**/*.ts'],
        ignores: [TESTS_PATTERN],
        extends: [
            baseConfig,
        ],
    },
    {
        name: 'tests',
        files: [TESTS_PATTERN],
        extends: [
            baseConfig,
        ],
        rules: {
            '@typescript-eslint/unbound-method': 'off',
        },
    },
    {
        name: 'configs',
        files: ['**/*.mjs', '**/*.js'],
        extends: [
            js.configs.recommended,
            stylistic.configs.recommended,
        ],
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
            ...stylisticRules,
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
]);
