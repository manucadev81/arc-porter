import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { analyze } from "../src/engine.js";
import { renderText } from "../src/report/text.js";
import { rules } from "../src/rules/index.js";
import { fixturesRoot } from "./support/fixtures.js";

function sampleReport() {
  const files = ["AP001/bad/Raffle.sol", "AP004/bad/BurnByTransfer.sol", "AP008/good/UsdcRouter.sol"];
  const inputs = files.map((file) => ({ file, source: readFileSync(join(fixturesRoot, file), "utf8") }));
  inputs.push({ file: "broken.sol", source: "pragma solidity ^0.8.20;\ncontract {" });
  return analyze(inputs, defaultConfig(rules));
}

describe("text report", () => {
  it("matches the snapshot without color", () => {
    expect(renderText(sampleReport())).toMatchSnapshot();
  });

  it("always carries the disclaimer and the sources date", () => {
    const text = renderText(sampleReport());
    expect(text).toContain("not an audit");
    expect(text).toContain("Sources verified on 2026-11-13");
    expect(text).toContain("1 file(s) not analyzed");
  });

  it("adds ANSI colors only when asked", () => {
    const plain = renderText(sampleReport());
    const colored = renderText(sampleReport(), { color: true });
    expect(plain).not.toContain("\u001b[");
    expect(colored).toContain("\u001b[31m");
  });
});
