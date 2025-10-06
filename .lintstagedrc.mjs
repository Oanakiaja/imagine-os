export default {
  '*.{ts,tsx}': ['eslint --fix', 'vitest related --run'],
  '*.{js,jsx,mjs,cjs}': ['eslint --fix'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
