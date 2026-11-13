import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import { analyzeFile } from "../../src/engine.js";
import type { Finding, Rule } from "../../src/finding.js";
import { rules } from "../../src/rules/index.js";

export const fixturesRoot = fileURLToPath(new URL("../../fixtures/", import.meta.url));
export const corpusRoot = fileURLToPath(new URL("../../corpus/", import.meta.url));

export function solidityFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".sol")) out.push(full);
    }
  };
  walk(dir);
  return out.sort();
}

export function analyzePath(path: string, ruleSet: readonly Rule[] = rules) {
  const file = relative(fixturesRoot, path).replace(/\\/g, "/");
  return analyzeFile({ file, source: readFileSync(path, "utf8") }, [...ruleSet]);
}

export function findingsFor(ruleId: string, dir: string): { file: string; findings: Finding[] }[] {
  return solidityFiles(dir).map((path) => {
    const analysis = analyzePath(path);
    expect(analysis.error, `${path} must parse`).toBeUndefined();
    return { file: analysis.file, findings: analysis.findings.filter((f) => f.ruleId === ruleId) };
  });
}

export function expectRuleFixtures(ruleId: string): void {
  const bad = findingsFor(ruleId, join(fixturesRoot, ruleId, "bad"));
  const good = findingsFor(ruleId, join(fixturesRoot, ruleId, "good"));
  expect(bad.length, `${ruleId} needs at least one bad example`).toBeGreaterThan(0);
  expect(good.length, `${ruleId} needs at least one good example`).toBeGreaterThan(0);
  for (const { file, findings } of bad) {
    expect(findings.length, `${file} must trigger ${ruleId}`).toBeGreaterThan(0);
  }
  for (const { file, findings } of good) {
    expect(findings, `${file} must not trigger ${ruleId}`).toEqual([]);
  }
}
