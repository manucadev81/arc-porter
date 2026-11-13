import { describe, expect, it } from "vitest";
import { callArguments, classifyCall, isZeroAddress, recipientOf, sentValueOf } from "../src/ast.js";
import type { AstNode } from "../src/finding.js";
import { parseSource } from "../src/parse.js";

function expressions(body: string): AstNode[] {
  const parsed = parseSource(
    "x.sol",
    `pragma solidity ^0.8.20;\ncontract X { IERC20 t; function f(address payable a, address[] memory r) external payable { ${body} } }\ninterface IERC20 { function transfer(address, uint256) external returns (bool); function transferFrom(address, address, uint256) external returns (bool); function balanceOf(address) external view returns (uint256); function safeTransfer(address, uint256) external; }`,
  );
  if (!parsed.ok) throw new Error(parsed.failure.message);
  const contract = (parsed.parsed.ast.children as AstNode[])[1] as AstNode;
  const fn = (contract.subNodes as AstNode[])[1] as AstNode;
  const statements = (fn.body as AstNode).statements as AstNode[];
  return statements.map((s) => s.expression as AstNode);
}

describe("ast helpers", () => {
  it("recognizes every spelling of the zero address", () => {
    const [a, b, c, d, e, f] = expressions(
      "a.transfer(address(0)); a.transfer(address(0x0)); a.transfer(address(0x00)); a.transfer(address(uint160(0))); a.transfer(payable(address(0))); a.transfer(0x0000000000000000000000000000000000000000);",
    ).map((call) => callArguments(call as AstNode)[0]);
    for (const node of [a, b, c, d, e, f]) expect(isZeroAddress(node)).toBe(true);
    const [g, h] = expressions("a.transfer(address(1)); a.transfer(a);").map(
      (call) => callArguments(call as AstNode)[0],
    );
    expect(isZeroAddress(g)).toBe(false);
    expect(isZeroAddress(h)).toBe(false);
  });

  it("classifies calls by member name and arity", () => {
    const [native1, native2, call, token2, token3, safe, read, other] = expressions(
      'a.transfer(1); a.send(1); a.call{value: 1}(""); t.transfer(a, 1); t.transferFrom(a, a, 1); t.safeTransfer(a, 1); t.balanceOf(a); t.transfer(a, 1, 2);',
    ) as AstNode[];
    expect(classifyCall(native1 as AstNode).kind).toBe("native-send");
    expect(classifyCall(native2 as AstNode).kind).toBe("native-send");
    expect(classifyCall(call as AstNode).kind).toBe("native-send");
    expect(classifyCall(token2 as AstNode)).toEqual({ kind: "token", member: "transfer" });
    expect(classifyCall(token3 as AstNode)).toEqual({ kind: "token", member: "transferFrom" });
    expect(classifyCall(safe as AstNode)).toEqual({ kind: "token", member: "safeTransfer" });
    expect(classifyCall(read as AstNode)).toEqual({ kind: "token", member: "balanceOf" });
    expect(classifyCall(other as AstNode).kind).toBe("other");
  });

  it("finds the recipient and the sent value", () => {
    const [native, call, token, from] = expressions(
      'a.transfer(5); a.call{value: 7}(""); t.transfer(r[0], 1); t.transferFrom(a, r[1], 1);',
    ) as AstNode[];
    expect(recipientOf(native as AstNode)?.type).toBe("Identifier");
    expect((sentValueOf(native as AstNode) as AstNode).number).toBe("5");
    expect((sentValueOf(call as AstNode) as AstNode).number).toBe("7");
    expect(recipientOf(token as AstNode)?.type).toBe("IndexAccess");
    expect(recipientOf(from as AstNode)?.type).toBe("IndexAccess");
  });
});
