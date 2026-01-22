import js from "@eslint/js";

export default [
  { ignores: ["node_modules/**", "docs/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-irregular-whitespace": [
        "error",
        {
          skipComments: true,
          skipStrings: true,
          skipTemplates: true,
        },
      ],
    },
  },
  {
    files: ["bench/**/*.js"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
];
