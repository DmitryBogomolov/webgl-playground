module.exports = {
    'env': {
        'browser': true,
        'es6': true,
        'jest': true,
    },
    'extends': 'eslint:recommended',
    'globals': {
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly'
    },
    'parserOptions': {
        'ecmaVersion': 2018,
        'sourceType': 'module'
    },
    'rules': {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-multi-spaces': 'error',
        'comma-dangle': ['error', 'always-multiline'],
        'space-before-function-paren': [
            'error',
            { 'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always' },
        ],
        'key-spacing': 'error',
        'keyword-spacing': 'error',
        'func-call-spacing': 'error',
    },
};
