import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Must come before react(): turns src/routes/* into src/routeTree.gen.ts, one lazy chunk per route.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  // The editor route bundles Tiptap/ProseMirror + Yjs (~700 kB, ~215 kB gzipped). It is lazy-loaded,
  // so only someone opening a draft downloads it. Vite warns above 500 kB; this is a known, accepted size.
  build: { chunkSizeWarningLimit: 800 },
});
