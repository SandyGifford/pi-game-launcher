import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	css: {
		modules: {
			generateScopedName: "[name]__[local]__[hash:base64:5]",
		},
	},
	server: {
		proxy: {
			"/api": "http://localhost:3000",
			"/icons": "http://localhost:3000",
		},
	},
});
