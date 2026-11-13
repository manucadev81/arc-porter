import { describe, expect, it } from "vitest";
import { parseSource } from "../src/parse.js";

describe("parseSource", () => {
  it("parses a valid contract with positions", () => {
    const result = parseSource("a.sol", "pragma solidity ^0.8.20;\ncontract A { uint256 x; }\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.parsed.ast.type).toBe("SourceUnit");
    const children = result.parsed.ast.children as { type: string; loc?: { start: { line: number } } }[];
    expect(children[1]?.type).toBe("ContractDefinition");
    expect(children[1]?.loc?.start.line).toBe(2);
  });

  it("reports a parse failure with the file name and position", () => {
    const result = parseSource("broken.sol", "pragma solidity ^0.8.20;\ncontract { uint256 x; }\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.file).toBe("broken.sol");
    expect(result.failure.message).toMatch(/line 2/);
  });
});
