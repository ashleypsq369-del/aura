import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
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
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // ── Accessibility rules (WCAG 2.1 AA) ───────────────────────────
      // Critical: interactive elements must be accessible
      'jsx-a11y/alt-text':                    'error',
      'jsx-a11y/anchor-is-valid':             'warn',
      'jsx-a11y/aria-props':                  'error',
      'jsx-a11y/aria-proptypes':              'error',
      'jsx-a11y/aria-role':                   'error',
      'jsx-a11y/aria-unsupported-elements':   'error',
      'jsx-a11y/click-events-have-key-events':'warn',
      'jsx-a11y/heading-has-content':         'warn',
      'jsx-a11y/html-has-lang':               'error',
      'jsx-a11y/img-redundant-alt':           'warn',
      'jsx-a11y/interactive-supports-focus':  'warn',
      'jsx-a11y/label-has-associated-control':'warn',
      'jsx-a11y/no-access-key':               'warn',
      'jsx-a11y/no-autofocus':                'warn',
      // Turned off — Radix handles these natively
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
])
