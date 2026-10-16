import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.resolve(__dirname, "..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@flowink\/project-schema$/,
        replacement: path.resolve(
          root,
          "packages/flowink-project-schema/src/index.ts",
        ),
      },
      {
        find: /^@flowink\/animation-core$/,
        replacement: path.resolve(
          root,
          "packages/flowink-animation-core/src/index.ts",
        ),
      },
      {
        find: /^@flowink\/presentation-core$/,
        replacement: path.resolve(
          root,
          "packages/flowink-presentation-core/src/index.ts",
        ),
      },
      {
        find: /^@flowink\/player-runtime$/,
        replacement: path.resolve(
          root,
          "packages/flowink-player-runtime/src/index.ts",
        ),
      },
      {
        find: /^@flowink\/export-runtime$/,
        replacement: path.resolve(
          root,
          "packages/flowink-export-runtime/src/index.ts",
        ),
      },
      {
        find: /^@flowink\/ui$/,
        replacement: path.resolve(root, "packages/flowink-ui/src/index.tsx"),
      },
      {
        find: /^@excalidraw\/excalidraw$/,
        replacement: path.resolve(root, "packages/excalidraw/index.tsx"),
      },
      {
        find: /^@excalidraw\/excalidraw\/(.*)/,
        replacement: path.resolve(root, "packages/excalidraw/$1"),
      },
      {
        find: /^@excalidraw\/common$/,
        replacement: path.resolve(root, "packages/common/src/index.ts"),
      },
      {
        find: /^@excalidraw\/common\/(.*)/,
        replacement: path.resolve(root, "packages/common/src/$1"),
      },
      {
        find: /^@excalidraw\/element$/,
        replacement: path.resolve(root, "packages/element/src/index.ts"),
      },
      {
        find: /^@excalidraw\/element\/(.*)/,
        replacement: path.resolve(root, "packages/element/src/$1"),
      },
      {
        find: /^@excalidraw\/math$/,
        replacement: path.resolve(root, "packages/math/src/index.ts"),
      },
      {
        find: /^@excalidraw\/math\/(.*)/,
        replacement: path.resolve(root, "packages/math/src/$1"),
      },
      {
        find: /^@excalidraw\/utils$/,
        replacement: path.resolve(root, "packages/utils/src/index.ts"),
      },
      {
        find: /^@excalidraw\/utils\/(.*)/,
        replacement: path.resolve(root, "packages/utils/src/$1"),
      },
      {
        find: /^@excalidraw\/fractional-indexing$/,
        replacement: path.resolve(
          root,
          "packages/fractional-indexing/src/index.ts",
        ),
      },
      {
        find: /^@excalidraw\/fractional-indexing\/(.*)/,
        replacement: path.resolve(root, "packages/fractional-indexing/src/$1"),
      },
      {
        find: /^@excalidraw\/laser-pointer$/,
        replacement: path.resolve(root, "packages/laser-pointer/src/index.ts"),
      },
      {
        find: /^@excalidraw\/laser-pointer\/(.*)/,
        replacement: path.resolve(root, "packages/laser-pointer/src/$1"),
      },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 4174,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
