import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  base: "/",
  plugins: [react()],
  define: { "import.meta.env.VITE_PRIVATE_REGISTRY": JSON.stringify("true") },
  publicDir: path.resolve(import.meta.dirname, "../../.private-preview"),
  build: { outDir: path.resolve(import.meta.dirname, "../../dist/client"), emptyOutDir: true },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
});
