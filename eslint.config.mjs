import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
