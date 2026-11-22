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
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (
            id.includes("@tiptap") ||
            id.includes("prosemirror") ||
            id.includes("yjs") ||
            id.includes("y-protocols")
          ) {
            return "editor-vendor";
          }
          if (id.includes("@multiavatar")) {
            return "avatar-vendor";
          }
        },
      },
    },
  },
});
