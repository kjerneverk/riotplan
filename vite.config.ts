import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "riotplan",
      fileName: () => "index.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "js-yaml",
        "marked",
        "riotprompt",
        "agentic",
        "execution",
        "node:fs",
        "node:path",
        "node:fs/promises",
      ],
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
