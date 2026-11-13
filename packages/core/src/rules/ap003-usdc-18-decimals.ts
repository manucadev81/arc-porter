import { numberLiteral, subdenomination } from "../ast.js";
import type { AstNode, Rule } from "../finding.js";
import { DOCS } from "../sources.js";

function isEighteenScale(node: AstNode): boolean {
  const literal = numberLiteral(node);
  if (literal !== undefined) {
    if (/^1e18$/i.test(literal)) return true;
    if (/^1_?000_?000_?000_?000_?000_?000$/.test(literal)) return true;
  }
  if (node.type === "BinaryOperation" && node.operator === "**") {
    const base = node.left as AstNode | undefined;
    const exponent = node.right as AstNode | undefined;
    return numberLiteral(base) === "10" && numberLiteral(exponent) === "18";
  }
  return false;
}

export const ap003: Rule = {
  id: "AP003",
  name: "usdc-18-decimals",
  title: "Arc USDC scaled as an 18-decimal token",
  severity: "high",
  confidence: "medium",
  docUrl: `${DOCS.contractAddresses}#usdc`,
  sources: [DOCS.contractAddresses, DOCS.stablecoinModel],
  description:
    "The USDC ERC-20 interface at 0x3600000000000000000000000000000000000000 uses 6 decimals. A file that hard-codes that address and also scales amounts by 1e18, 10**18 or the ether unit is very likely treating USDC like an 18-decimal token.",
  suggestion:
    "Scale USDC amounts by 1e6 (or read decimals() at runtime) when using the ERC-20 interface; reserve 1e18 for native value only.",
  badExample: `interface IERC20 {
    function transfer(address, uint256) external returns (bool);
}

contract Payout {
    IERC20 constant USDC = IERC20(0x3600000000000000000000000000000000000000);

    function pay(address to, uint256 dollars) external {
        USDC.transfer(to, dollars * 1e18);
    }
}`,
  goodExample: `interface IERC20 {
    function transfer(address, uint256) external returns (bool);
}

contract Payout {
    IERC20 constant USDC = IERC20(0x3600000000000000000000000000000000000000);

    function pay(address to, uint256 dollars) external {
        USDC.transfer(to, dollars * 1e6);
    }
}`,
  check(context) {
    if (!context.index.hasUsdcAddress) return [];
    const matches = [];
    for (const { node } of context.nodes("NumberLiteral")) {
      if (subdenomination(node) === "ether" || isEighteenScale(node)) {
        matches.push({
          node,
          message: "This file names the 6-decimal USDC address but scales a value by 10^18.",
        });
      }
    }
    for (const { node } of context.nodes("BinaryOperation")) {
      if (isEighteenScale(node)) {
        matches.push({
          node,
          message: "This file names the 6-decimal USDC address but scales a value by 10**18.",
        });
      }
    }
    return matches;
  },
};
