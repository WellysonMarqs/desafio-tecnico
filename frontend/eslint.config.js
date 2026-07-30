const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json']
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['src/**/*.spec.ts', 'src/test.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.spec.json']
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        fail: 'readonly',
        jasmine: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
