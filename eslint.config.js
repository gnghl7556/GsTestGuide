import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import noHardcodedTailwindColors from './eslint-rules/no-hardcoded-tailwind-colors.js'

export default defineConfig([
  globalIgnores(['dist', 'functions/lib/**', '**/*.tsbuildinfo']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/constants/schedule.ts',
      'src/components/schedule/**',
      'src/features/test-setup/components/ScheduleCalendar.tsx',
      'src/features/test-setup/components/TestSetupPage.tsx',
      'src/features/test-setup/components/TestInfoCard.tsx',
      'src/features/test-setup/components/modals/ParsingOverlay.tsx',
    ],
    plugins: {
      local: {
        rules: {
          'no-hardcoded-tailwind-colors': noHardcodedTailwindColors,
        },
      },
    },
    rules: {
      'local/no-hardcoded-tailwind-colors': 'warn',
    },
  },
])
