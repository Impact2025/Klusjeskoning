module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'jest --findRelatedTests --passWithNoTests',
  ],
  '*.{json,css,md}': [
    'prettier --write',
  ],
};