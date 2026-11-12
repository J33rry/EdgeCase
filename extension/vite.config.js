import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: { port: 5173, strictPort: true, cors: { origin: [/chrome-extension:\/\//] } },
  // Stable (unhashed) file names: a rebuild then can't leave an already-loaded
  // extension pointing at deleted files, which makes the tutor silently vanish.
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
