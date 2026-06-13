import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Разрешаем неиспользуемые переменные, начинающиеся с _
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }],
      // Отключаем экспериментальные/шумные правила React Compiler
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      // shadcn/ui экспортирует вспомогательные функции рядом с компонентами
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        ym: 'readonly',
      },
    },
  },
])
