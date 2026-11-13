import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyConfig, meetsThreshold, resolveConfig, validateConfig } from "../src/config.js";
import { analyze } from "../src/engine.js";
import { matchesGlob } from "../src/glob.js";
import { ruleIds, rules } from "../src/rules/index.js";
import { fixturesRoot } from "./support/fixtures.js";

const raffle = {
  file: "src/Raffle.sol",
  source: readFileSync(join(fixturesRoot, "AP001/bad/Raffle.sol"), "utf8"),
};
const splitter = {
  file: "src/LoopSplitter.sol",
  source: readFileSync(join(fixturesRoot, "AP005/bad/LoopSplitter.sol"), "utf8"),
};

describe("validateConfig", () => {
  it("accepts the documented example", () => {
    const result = validateConfig(
      {
        failOn: "high",
        ignore: ["test/**", "script/**"],
        rules: { AP010: "off", AP005: "high" },
        suppressions: [
          { rule: "AP006", file: "src/Legacy.sol", reason: "Contract is never deployed on Arc" },
        ],
      },
      ruleIds,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a suppression without a reason", () => {
    const result = validateConfig({ suppressions: [{ rule: "AP006", file: "src/Legacy.sol" }] }, ruleIds);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join("\n")).toMatch(/reason is required/);
  });

  it("rejects an empty reason, an unknown rule, a bad severity and unknown fields", () => {
    const result = validateConfig(
      {
        failOn: "critical",
        rules: { AP999: "on", AP001: "loud" },
        suppressions: [{ rule: "AP001", file: "a.sol", reason: "   " }],
        extra: true,
      },
      ruleIds,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(5);
  });

  it("rejects non-object input", () => {
    expect(validateConfig([], ruleIds).ok).toBe(false);
    expect(validateConfig("x", ruleIds).ok).toBe(false);
  });
});

describe("resolveConfig and applyConfig", () => {
  it("turns rules off and changes severity", () => {
    const config = resolveConfig({ rules: { AP001: "off", AP005: "high" } }, rules);
    expect(config.rules.find((r) => r.id === "AP001")).toBeUndefined();
    expect(config.rules.find((r) => r.id === "AP005")?.severity).toBe("high");
    const report = analyze([raffle, splitter], config);
    expect(report.findings.some((f) => f.ruleId === "AP001")).toBe(false);
    expect(report.findings.filter((f) => f.ruleId === "AP005").every((f) => f.severity === "high")).toBe(
      true,
    );
  });

  it("ignores default and configured paths", () => {
    const config = resolveConfig({ ignore: ["src/Loop*.sol"] }, rules);
    const report = analyze([raffle, splitter, { ...raffle, file: "lib/forge-std/Raffle.sol" }], config);
    expect(report.findings.map((f) => f.file)).toEqual(["src/Raffle.sol"]);
  });

  it("moves suppressed findings to the suppressed section with their reason", () => {
    const config = resolveConfig(
      { suppressions: [{ rule: "AP001", file: "src/*.sol", reason: "Raffle is a testnet toy" }] },
      rules,
    );
    const report = analyze([raffle], config);
    expect(report.findings.filter((f) => f.ruleId === "AP001")).toHaveLength(0);
    expect(report.suppressed).toHaveLength(1);
    expect(report.suppressed[0]?.reason).toBe("Raffle is a testnet toy");
    expect(report.summary.suppressed).toBe(1);
  });

  it("suppresses by line when a line is given", () => {
    const config = resolveConfig(
      { suppressions: [{ rule: "AP005", file: "src/LoopSplitter.sol", line: 17, reason: "reviewed" }] },
      rules,
    );
    const report = analyze([splitter], config);
    expect(report.suppressed.map((f) => f.line)).toEqual([17]);
    expect(report.findings.filter((f) => f.ruleId === "AP005").length).toBeGreaterThan(0);
  });

  it("applyConfig keeps unmatched findings", () => {
    const config = resolveConfig({}, rules);
    const finding = analyze([raffle], config).findings[0];
    if (!finding) throw new Error("expected a finding");
    expect(applyConfig(finding, config).kind).toBe("keep");
  });

  it("meetsThreshold compares severities in order", () => {
    expect(meetsThreshold("high", "high")).toBe(true);
    expect(meetsThreshold("medium", "high")).toBe(false);
    expect(meetsThreshold("low", "low")).toBe(true);
    expect(meetsThreshold("medium", "low")).toBe(true);
  });
});

describe("glob matching", () => {
  it("handles **, * and ?", () => {
    expect(matchesGlob("a/b/c.sol", "**/c.sol")).toBe(true);
    expect(matchesGlob("c.sol", "**/c.sol")).toBe(true);
    expect(matchesGlob("lib/x/y.sol", "**/lib/**")).toBe(true);
    expect(matchesGlob("lib/y.sol", "lib/**")).toBe(true);
    expect(matchesGlob("src/lib.sol", "lib/**")).toBe(false);
    expect(matchesGlob("src/A.sol", "src/*.sol")).toBe(true);
    expect(matchesGlob("src/x/A.sol", "src/*.sol")).toBe(false);
    expect(matchesGlob("src/A.sol", "src/?.sol")).toBe(true);
    expect(matchesGlob("./src/A.sol", "src/A.sol")).toBe(true);
  });
});
