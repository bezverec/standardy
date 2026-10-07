import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  base: "/editor/",
  plugins: [react()],
  build: { outDir: path.resolve(import.meta.dirname, "../../site/editor"), emptyOutDir: true },
});
