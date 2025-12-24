import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    headers: {
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-store",
    },
    strictPort: true,
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      input: "index.html",
    },
  },
});
