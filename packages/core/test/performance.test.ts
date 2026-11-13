import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { analyze } from "../src/engine.js";
import { rules } from "../src/rules/index.js";
import { corpusRoot, fixturesRoot, solidityFiles } from "./support/fixtures.js";

describe("NFR-001", () => {
  it("analyzes 100 files in under two seconds", () => {
    const sources = [...solidityFiles(fixturesRoot), ...solidityFiles(corpusRoot)]
      .filter((path) => !path.includes("/external/"))
      .map((path) => ({ file: relative(fixturesRoot, path), source: readFileSync(path, "utf8") }));
    const inputs = Array.from({ length: 100 }, (_, i) => {
      const base = sources[i % sources.length];
      if (!base) throw new Error("no sources");
      return { file: `bench/${i}-${base.file.replace(/\//g, "_")}`, source: base.source };
    });
    const started = performance.now();
    const report = analyze(inputs, { ...defaultConfig(rules), ignore: [] });
    const elapsed = performance.now() - started;
    expect(report.summary.files).toBe(100);
    expect(report.errors).toEqual([]);
    expect(elapsed).toBeLessThan(2000);
  });
});
