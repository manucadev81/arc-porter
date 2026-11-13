import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeFile } from "../src/engine.js";
import { rules } from "../src/rules/index.js";
import { expectRuleFixtures, fixturesRoot, solidityFiles } from "./support/fixtures.js";

describe("rule fixtures (SC-001)", () => {
  for (const rule of rules) {
    it(`${rule.id} ${rule.name}: every bad example fires, no good example fires`, () => {
      expectRuleFixtures(rule.id);
    });
  }

  it("no good example of any rule triggers any rule", () => {
    const offenders: string[] = [];
    for (const path of solidityFiles(fixturesRoot)) {
      if (!path.includes("/good/")) continue;
      const file = relative(fixturesRoot, path);
      const analysis = analyzeFile({ file, source: readFileSync(path, "utf8") }, [...rules]);
      for (const finding of analysis.findings) offenders.push(`${file}: ${finding.ruleId}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("rule metadata", () => {
  it("every rule cites an Arc docs page", () => {
    for (const rule of rules) {
      expect(rule.docUrl.startsWith("https://docs.arc.io/")).toBe(true);
      expect(rule.sources.length).toBeGreaterThan(0);
      for (const source of rule.sources) expect(source.startsWith("https://docs.arc.io/")).toBe(true);
    }
  });

  it("rule ids are unique and ordered", () => {
    const ids = rules.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
  });

  it("every rule ships a bad and a good example that parse", () => {
    for (const rule of rules) {
      const bad = analyzeFile({ file: "bad.sol", source: `pragma solidity ^0.8.20;\n${rule.badExample}` }, [
        rule,
      ]);
      const good = analyzeFile(
        { file: "good.sol", source: `pragma solidity ^0.8.20;\n${rule.goodExample}` },
        [rule],
      );
      expect(bad.error, `${rule.id} badExample must parse`).toBeUndefined();
      expect(good.error, `${rule.id} goodExample must parse`).toBeUndefined();
      expect(bad.findings.length, `${rule.id} badExample must fire`).toBeGreaterThan(0);
      expect(good.findings, `${rule.id} goodExample must not fire`).toEqual([]);
    }
  });
});
