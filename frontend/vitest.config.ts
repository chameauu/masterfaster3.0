import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		// Skip CSS processing in tests completely
		css: false,
		// Set environment variable to skip PostCSS in tests
		env: {
			VITEST: "true",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
	},
	// Completely disable CSS processing for tests
	css: false as any,
});
