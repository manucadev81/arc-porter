import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { check, discoverFiles, explainRule, listRules, UsageError } from "../src/run.js";

const fixtures = fileURLToPath(new URL("../../core/fixtures/", import.meta.url));

function project(): string {
  const dir = mkdtempSync(join(tmpdir(), "arc-porter-"));
  mkdirSync(join(dir, "src"));
  mkdirSync(join(dir, "lib", "dep"), { recursive: true });
  mkdirSync(join(dir, "test"));
  writeFileSync(join(dir, "src", "Raffle.sol"), readFileSync(join(fixtures, "AP001/bad/Raffle.sol")));
  writeFileSync(join(dir, "src", "Splitter.sol"), readFileSync(join(fixtures, "AP005/bad/LoopSplitter.sol")));
  writeFileSync(join(dir, "src", "Clean.sol"), readFileSync(join(fixtures, "AP008/good/UsdcRouter.sol")));
  writeFileSync(
    join(dir, "lib", "dep", "Vendored.sol"),
    readFileSync(join(fixtures, "AP006/bad/Closable.sol")),
  );
  writeFileSync(join(dir, "test", "Gate.sol"), readFileSync(join(fixtures, "AP010/bad/EmptyCheck.sol")));
  return dir;
}

function run(cwd: string, overrides: Partial<Parameters<typeof check>[0]> = {}) {
  return check({ paths: [], format: "text", color: false, cwd, ...overrides });
}

describe("arc-porter check", () => {
  it("finds .sol files, skips lib/ by default and exits 1 on a high finding", () => {
    const dir = project();
    const outcome = run(dir);
    expect(outcome.exitCode).toBe(1);
    expect(outcome.report?.summary.files).toBe(4);
    expect(outcome.stdout).toContain("src/Raffle.sol:11");
    expect(outcome.stdout).not.toContain("Vendored.sol");
    expect(outcome.stdout).toContain("not an audit");
  });

  it("exits 0 when nothing reaches the threshold", () => {
    const dir = project();
    expect(run(dir, { paths: ["src/Clean.sol"] }).exitCode).toBe(0);
    expect(run(dir, { paths: ["src/Splitter.sol"] }).exitCode).toBe(0);
    expect(run(dir, { paths: ["src/Splitter.sol"], failOn: "medium" }).exitCode).toBe(1);
    expect(run(dir, { paths: ["test"], failOn: "low" }).exitCode).toBe(1);
  });

  it("exits 2, names the file and still analyzes the rest when a file does not parse", () => {
    const dir = project();
    writeFileSync(join(dir, "src", "Broken.sol"), "pragma solidity ^0.8.20;\ncontract {");
    const outcome = run(dir, { paths: ["src"] });
    expect(outcome.exitCode).toBe(2);
    expect(outcome.stdout).toContain("src/Broken.sol: line 2");
    expect(outcome.stdout).toContain("src/Raffle.sol:11");
  });

  it("accepts globs and explicit files", () => {
    const dir = project();
    expect(discoverFiles(["src/*.sol"], [], dir)).toEqual([
      "src/Clean.sol",
      "src/Raffle.sol",
      "src/Splitter.sol",
    ]);
    expect(discoverFiles(["src/Raffle.sol"], [], dir)).toEqual(["src/Raffle.sol"]);
    expect(discoverFiles(["lib"], ["**/lib/**"], dir)).toEqual([]);
  });

  it("writes json and sarif to a file when --output is given", () => {
    const dir = project();
    const json = run(dir, { format: "json", output: "report.json" });
    expect(json.stdout).toBe("");
    expect(json.stderr).toContain("report.json");
    const parsed = JSON.parse(readFileSync(join(dir, "report.json"), "utf8"));
    expect(parsed.tool.name).toBe("arc-porter");
    const sarif = run(dir, { format: "sarif", output: "report.sarif" });
    expect(sarif.exitCode).toBe(1);
    const log = JSON.parse(readFileSync(join(dir, "report.sarif"), "utf8"));
    expect(log.version).toBe("2.1.0");
    expect(log.runs[0].results.length).toBeGreaterThan(0);
  });

  it("applies the config file: ignore, rules off, suppressions and failOn", () => {
    const dir = project();
    writeFileSync(
      join(dir, "arc-porter.json"),
      JSON.stringify({
        failOn: "low",
        ignore: ["test/**"],
        rules: { AP001: "off" },
        suppressions: [{ rule: "AP005", file: "src/Splitter.sol", reason: "Batch is admin-only on testnet" }],
      }),
    );
    const outcome = run(dir, { config: "arc-porter.json" });
    expect(outcome.exitCode).toBe(0);
    expect(outcome.report?.findings).toEqual([]);
    expect(outcome.report?.summary.suppressed).toBe(3);
    expect(outcome.stdout).toContain("Batch is admin-only on testnet");
  });

  it("rejects a suppression without reason with exit code 2", () => {
    const dir = project();
    writeFileSync(
      join(dir, "arc-porter.json"),
      JSON.stringify({ suppressions: [{ rule: "AP005", file: "src/Splitter.sol" }] }),
    );
    expect(() => run(dir, { config: "arc-porter.json" })).toThrow(UsageError);
    expect(() => run(dir, { config: "missing.json" })).toThrow(UsageError);
    expect(() => run(dir, { format: "xml" as "text" })).toThrow(UsageError);
    expect(() => run(dir, { failOn: "critical" as "low" })).toThrow(UsageError);
  });

  it("reports when no files are found", () => {
    const dir = project();
    const outcome = run(dir, { paths: ["nothing-here"] });
    expect(outcome.exitCode).toBe(0);
    expect(outcome.stderr).toContain("No Solidity files found");
  });
});

describe("arc-porter rules and explain", () => {
  it("lists all thirteen rules", () => {
    const text = listRules("text");
    for (const id of ["AP001", "AP007", "AP013"]) expect(text).toContain(id);
    const json = JSON.parse(listRules("json"));
    expect(json).toHaveLength(13);
    expect(json[0].docUrl).toMatch(/^https:\/\/docs\.arc\.io\//);
  });

  it("explains a rule by id or name and rejects unknown ids", () => {
    const byId = explainRule("ap005");
    expect(byId).toContain("push-payment-loop");
    expect(byId).toContain("Bad:");
    expect(byId).toContain("Good:");
    expect(byId).toContain("Source: https://docs.arc.io/");
    expect(explainRule("selfdestruct-usage")).toContain("AP006");
    expect(() => explainRule("AP999")).toThrow(UsageError);
  });
});
