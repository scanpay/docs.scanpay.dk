import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            'one-var': 'off',
            'sort-keys': 'off',
            'func-style': ['error', 'declaration'],
            'max-statements': ['warn', 15, { ignoreTopLevelFunctions: true }],
            'no-inline-comments': 'off',
            'no-ternary': 'off',
            'no-magic-numbers': 'off',
            'capitalized-comments': 'off',
            'no-nested-ternary': 'off',
            'no-plusplus': 'off',
            'id-length': 'off',
        },
    },
    {
        files: ['gulpfile.js', 'lib/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'commonjs',
        },
    },
    {
        files: ['src/assets/js/**.ts'],
        languageOptions: {
            parser: 'typescript-eslint/parser',
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'script',
            },
            plugins: ['typescript-eslint'],
        },
    },
];
