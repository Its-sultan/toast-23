import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");

export default defineConfig({
  plugins: [
    react(),
    // Only run vite-plugin-dts during library build, not while serving the playground
    ...(isBuild
      ? [
          dts({
            rollupTypes: false,
            tsConfigFilePath: "./tsconfig.json",
          }),
        ]
      : []),
  ],
  // Dev server entry: the playground
  root: isBuild ? undefined : resolve(__dirname),
  server: {
    open: "/playground/",
    port: 5173,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/__tests__/setup.ts",
    css: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Toast23",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-dom/client": "ReactDOMClient",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    sourcemap: true,
    cssCodeSplit: false,
  },
});
