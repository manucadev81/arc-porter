import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv } from "ajv";
import { describe, expect, it } from "vitest";
import { defaultConfig, resolveConfig } from "../src/config.js";
import { analyze } from "../src/engine.js";
import { renderJson } from "../src/report/json.js";
import { renderSarif, toSarif } from "../src/report/sarif.js";
import { rules } from "../src/rules/index.js";
import { fixturesRoot } from "./support/fixtures.js";

function inputs() {
  const files = ["AP001/bad/Raffle.sol", "AP005/bad/LoopSplitter.sol", "AP013/good/BlockOrdering.sol"];
  const list = files.map((file) => ({ file, source: readFileSync(join(fixturesRoot, file), "utf8") }));
  list.push({ file: "broken.sol", source: "pragma solidity ^0.8.20;\ncontract {" });
  return list;
}

function sampleReport() {
  const config = resolveConfig(
    {
      suppressions: [
        { rule: "AP005", file: "AP005/bad/LoopSplitter.sol", line: 33, reason: "Token path is reviewed" },
      ],
    },
    rules,
  );
  return analyze(inputs(), config);
}

describe("json report", () => {
  it("matches the snapshot", () => {
    expect(renderJson(sampleReport())).toMatchSnapshot();
  });

  it("is identical across runs with the same input", () => {
    expect(renderJson(sampleReport())).toBe(renderJson(sampleReport()));
  });

  it("round-trips through JSON.parse with the documented shape", () => {
    const parsed = JSON.parse(renderJson(sampleReport()));
    expect(parsed.tool.name).toBe("arc-porter");
    expect(Object.keys(parsed).sort()).toEqual(
      ["disclaimer", "errors", "findings", "sourcesVerifiedAt", "summary", "suppressed", "tool"].sort(),
    );
    expect(parsed.summary.suppressed).toBe(1);
    expect(parsed.suppressed[0].reason).toBe("Token path is reviewed");
  });
});

describe("sarif report", () => {
  it("matches the snapshot", () => {
    expect(renderSarif(sampleReport())).toMatchSnapshot();
  });

  it("validates against the SARIF 2.1.0 schema", () => {
    const schema = JSON.parse(
      readFileSync(fileURLToPath(new URL("./schemas/sarif-2.1.0.json", import.meta.url)), "utf8"),
    );
    const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
    const validate = ajv.compile(schema);
    const sarif = toSarif(sampleReport());
    const ok = validate(sarif);
    expect(validate.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
  });

  it("maps severities to levels, keeps suppressions and reports parse errors", () => {
    const sarif = toSarif(sampleReport()) as {
      runs: {
        tool: { driver: { rules: { id: string }[] } };
        results: { ruleId: string; level: string; suppressions?: unknown[] }[];
        invocations: { executionSuccessful: boolean; toolExecutionNotifications: unknown[] }[];
      }[];
    };
    const run = sarif.runs[0];
    if (!run) throw new Error("missing run");
    expect(run.tool.driver.rules.map((r) => r.id)).toEqual(rules.map((r) => r.id));
    expect(run.results.find((r) => r.ruleId === "AP001")?.level).toBe("error");
    expect(run.results.filter((r) => r.suppressions)).toHaveLength(1);
    expect(run.invocations[0]?.executionSuccessful).toBe(false);
    expect(run.invocations[0]?.toolExecutionNotifications).toHaveLength(1);
  });

  it("validates an empty report too", () => {
    const schema = JSON.parse(
      readFileSync(fileURLToPath(new URL("./schemas/sarif-2.1.0.json", import.meta.url)), "utf8"),
    );
    const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
    const validate = ajv.compile(schema);
    expect(validate(toSarif(analyze([], defaultConfig(rules))))).toBe(true);
  });
});
