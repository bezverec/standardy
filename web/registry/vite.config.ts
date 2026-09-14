import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  base: "/registry/",
  plugins: [react()],
  build: {
    outDir: path.resolve(import.meta.dirname, "../../site/registry"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
});
