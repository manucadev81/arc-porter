import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { analyze, analyzeFile } from "../src/engine.js";
import { rules } from "../src/rules/index.js";
import { corpusRoot, solidityFiles } from "./support/fixtures.js";

function load(dir: string) {
  return solidityFiles(dir).map((path) => ({
    file: relative(corpusRoot, path).replace(/\\/g, "/"),
    source: readFileSync(path, "utf8"),
  }));
}

describe("corpus", () => {
  it("SC-002: arc-milestone-escrow has no high-severity finding", () => {
    const report = analyze(load(join(corpusRoot, "arc-milestone-escrow")), {
      ...defaultConfig(rules),
      ignore: [],
    });
    expect(report.errors).toEqual([]);
    expect(report.findings.filter((f) => f.severity === "high")).toEqual([]);
  });

  it("SC-003: the WETH-style router pattern fires AP007", () => {
    const path = join(corpusRoot, "patterns", "WethStyleRouter.sol");
    const analysis = analyzeFile(
      { file: "patterns/WethStyleRouter.sol", source: readFileSync(path, "utf8") },
      [...rules],
    );
    expect(analysis.error).toBeUndefined();
    expect(analysis.findings.some((f) => f.ruleId === "AP007")).toBe(true);
  });

  it("SC-003: the real UniswapV2Router02 fires AP007 when present", () => {
    const path = join(corpusRoot, "external", "UniswapV2Router02.sol");
    if (!existsSync(path)) return;
    const analysis = analyzeFile(
      { file: "external/UniswapV2Router02.sol", source: readFileSync(path, "utf8") },
      [...rules],
    );
    expect(analysis.error).toBeUndefined();
    expect(analysis.findings.some((f) => f.ruleId === "AP007")).toBe(true);
  });

  it("SC-004: the official sample apps analyze without failing", () => {
    const inputs = load(join(corpusRoot, "sample-apps"));
    expect(inputs.length).toBeGreaterThanOrEqual(7);
    const report = analyze(inputs, { ...defaultConfig(rules), ignore: [] });
    expect(report.errors).toEqual([]);
    expect(report.summary.files).toBe(inputs.length);
  });
});
