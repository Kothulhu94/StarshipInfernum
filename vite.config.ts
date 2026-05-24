import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@cardEngine": resolve(__dirname, "src/cardEngine"),
      "@characterSystem": resolve(__dirname, "src/characterSystem"),
      "@encounterSystem": resolve(__dirname, "src/encounterSystem"),
      "@crisisSystem": resolve(__dirname, "src/crisisSystem"),
      "@scenarioData": resolve(__dirname, "src/scenarioData"),
      "@gameFlow": resolve(__dirname, "src/gameFlow"),
      "@mapGenerator": resolve(__dirname, "src/mapGenerator"),
      "@mapRenderer": resolve(__dirname, "src/mapRenderer"),
      "@narrativeSystem": resolve(__dirname, "src/narrativeSystem"),
      "@userInterface": resolve(__dirname, "src/userInterface"),
      "@audioSystem": resolve(__dirname, "src/audioSystem"),
      "@styleSheets": resolve(__dirname, "src/styleSheets"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "ES2022",
    outDir: "dist",
    sourcemap: true,
  },
});
