module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended',
  ],
  plugins: ['prettier'],
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true,
    Nullable: true,
  },
  // add your custom rules here
  rules: {},
  overrides: [],
};
