import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        cli: "src/cli/cli.ts",
      },
      name: "riotplan",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "commander",
        "chalk",
        "js-yaml",
        "marked",
        "riotprompt",
        "agentic",
        "execution",
        "node:fs",
        "node:path",
        "node:fs/promises",
        "node:os",
        "node:http",
        "node:url",
        "node:process",
      ],
      output: {
        entryFileNames: "[name].js",
      },
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
