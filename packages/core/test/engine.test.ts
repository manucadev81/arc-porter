import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { analyze, runRules } from "../src/engine.js";
import type { Rule } from "../src/finding.js";
import { parseSource } from "../src/parse.js";

const everyIdentifier: Rule = {
  id: "TEST1",
  name: "every-identifier",
  title: "Flags every identifier",
  severity: "low",
  confidence: "low",
  docUrl: "https://docs.arc.io/test",
  sources: ["https://docs.arc.io/test"],
  description: "",
  suggestion: "none",
  badExample: "",
  goodExample: "",
  check: (context) =>
    context.nodes("Identifier").map(({ node, fn, contract, loopDepth }) => ({
      node,
      message: `${String(contract?.name)}.${String(fn?.name)} depth ${loopDepth}`,
    })),
};

const source = `pragma solidity ^0.8.20;
contract Demo {
    uint256 total;
    function sum(uint256[] calldata xs) external {
        for (uint256 i; i < xs.length; i++) {
            total += xs[i];
        }
    }
}
`;

describe("engine", () => {
  it("dispatches nodes by type with contract, function and loop depth", () => {
    const parsed = parseSource("demo.sol", source);
    if (!parsed.ok) throw new Error(parsed.failure.message);
    const findings = runRules(parsed.parsed, [everyIdentifier]);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.ruleId === "TEST1" && f.file === "demo.sol")).toBe(true);
    const inLoop = findings.filter((f) => f.message.endsWith("depth 1"));
    expect(inLoop.length).toBeGreaterThan(0);
    expect(inLoop.every((f) => f.line >= 5 && f.line <= 7)).toBe(true);
    expect(findings.some((f) => f.message.startsWith("Demo.sum"))).toBe(true);
  });

  it("orders findings by file, line, column and rule", () => {
    const report = analyze(
      [
        { file: "b.sol", source },
        { file: "a.sol", source },
      ],
      { ...defaultConfig([everyIdentifier]), ignore: [] },
    );
    const keys = report.findings.map((f) => `${f.file}:${f.line}:${f.column}`);
    expect(keys).toEqual([...keys].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)));
    expect(report.findings[0]?.file).toBe("a.sol");
    expect(report.summary.files).toBe(2);
  });

  it("keeps going when one file does not parse and reports the error", () => {
    const report = analyze(
      [
        { file: "ok.sol", source },
        { file: "bad.sol", source: "contract {" },
      ],
      { ...defaultConfig([everyIdentifier]), ignore: [] },
    );
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.file).toBe("bad.sol");
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const config = defaultConfig([everyIdentifier]);
    const a = analyze([{ file: "demo.sol", source }], config);
    const b = analyze([{ file: "demo.sol", source }], config);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
