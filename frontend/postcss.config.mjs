// Skip PostCSS plugins during Vitest tests
// Vitest has css: false but still tries to load this config
const config = {
	plugins: process.env.VITEST ? [] : ["@tailwindcss/postcss"],
};

export default config;
