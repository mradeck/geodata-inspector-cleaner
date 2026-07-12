import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        help: "help.html",
        concept: "concept.html",
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
  },
});
