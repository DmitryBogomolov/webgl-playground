import { defineConfig, globalIgnores } from 'eslint/config';
// import globals from 'globals'; // TODO ??? Remove dependency?
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
    globalIgnores(['./node_modules/', './dist/']),
    {
        name: 'sources',
        // files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        files: ['**/*.ts'],
        ignores: ['**/*.test.ts'], // TODO: ???
        extends: [
            js.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            stylistic.configs.recommended,
        ],
        languageOptions: {
            // globals: globals.browser,
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
            '@stylistic/indent': ['error', 4],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/quote-props': ['error', 'consistent'],
        },
    },
]);
