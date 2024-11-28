module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:eslint-comments/recommended',
    'plugin:import/recommended',
  ],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts']
    },
    'import/resolver': {
      node: {},
      typescript: {
        alwaysTryTypes: true,
        roject: './tsconfig.json',
      }
    },
    'import/extensions': ['.ts'],
    'import/external-module-folders': ['node_modules'],
  },
  rules: {
    'import/no-default-export': 'error',
    'import/no-cycle': 'off',
    'import/no-duplicates': 'off',
    'import/no-unused-modules': 'off',
    'import/no-relative-packages': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-useless-path-segments': 'off',
    'import/no-self-import': 'off',
    'import/no-import-module-exports': 'off',
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'import/order': 'off',
    'import/no-named-default': 'off',
    'import/namespace': 'off',
    'import/named': 'off',
    'import/no-unresolved': 'off',
    'no-duplicate-imports': 'off',

    'no-underscore-dangle': 'off',
    'multiline-ternary': ['error', 'never'],
    'no-nested-ternary': ['error'],
    'no-else-return': ['error', { allowElseIf: true }],
    'no-plusplus': 'off',
    '@typescript-eslint/no-unused-expressions': ['error'],
    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^(_[0-9a-zA-Z]*)$',
      argsIgnorePattern: '^(_[0-9a-zA-Z]*)$',
    }],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],

    '@typescript-eslint/consistent-type-imports': ['error'],
    '@typescript-eslint/consistent-type-exports': ['error', {
      fixMixedExportsWithInlineTypeSpecifier: true,
    }],

    '@typescript-eslint/no-useless-constructor': 'error',

    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-bitwise': 'off',
    'no-buffer-constructor': 'off',
    'no-param-reassign': 'off',

    'prefer-arrow-callback': ['error', { allowNamedFunctions: true, allowUnboundThis: true }],
    'no-confusing-arrow': 'off',

    '@typescript-eslint/space-infix-ops': 'error',
    '@typescript-eslint/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    'class-methods-use-this': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'curly': ['error', 'all'],
    'max-len': ['error', { code: 120 }],
    'object-curly-newline': ['error', {
      ImportDeclaration: {
        multiline: true,
        consistent: true,
        minProperties: 100,
      },
    }],
    'yoda': 'off',
  }
};
