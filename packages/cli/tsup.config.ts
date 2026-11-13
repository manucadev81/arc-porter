import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  target: "node20",
  noExternal: ["@arc-porter/core"],
  banner: { js: "#!/usr/bin/env node" },
});
