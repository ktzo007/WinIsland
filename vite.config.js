import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    target: "chrome110", // WebView2 selalu Chromium modern → tanpa polyfill
    minify: "esbuild",
    sourcemap: false,
    reportCompressedSize: false,
  },
});
