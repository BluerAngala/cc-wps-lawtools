/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // 允许下划线前缀的未使用变量（用于表示有意忽略的参数）
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
}
