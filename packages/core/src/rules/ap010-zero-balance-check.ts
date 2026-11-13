import { classifyCall, numberLiteral } from "../ast.js";
import type { AstNode, Rule } from "../finding.js";
import { DOCS } from "../sources.js";

function isBalanceOf(node: AstNode | undefined): boolean {
  return node !== undefined && node.type === "FunctionCall" && classifyCall(node).member === "balanceOf";
}

export const ap010: Rule = {
  id: "AP010",
  name: "zero-balance-check",
  title: "balanceOf() == 0 does not mean the balance is empty",
  severity: "low",
  confidence: "low",
  docUrl: `${DOCS.porting}#steps`,
  sources: [DOCS.porting, DOCS.stablecoinModel],
  description:
    'The ERC-20 balanceOf on Arc truncates anything below 1e-6 USDC, so it reads 0 while the native balance still holds dust. Logic that treats balanceOf(...) == 0 as "empty" can be wrong.',
  suggestion:
    "Compare against the amount you need (balanceOf(x) >= amount) or read the native balance when exactness matters.",
  badExample: `interface IERC20 {
    function balanceOf(address) external view returns (uint256);
}

contract Gate {
    IERC20 usdc;

    function isEmpty(address account) external view returns (bool) {
        return usdc.balanceOf(account) == 0;
    }
}`,
  goodExample: `interface IERC20 {
    function balanceOf(address) external view returns (uint256);
}

contract Gate {
    IERC20 usdc;

    function canPay(address account, uint256 amount) external view returns (bool) {
        return usdc.balanceOf(account) >= amount;
    }
}`,
  check(context) {
    const matches = [];
    for (const { node } of context.nodes("BinaryOperation")) {
      if (node.operator !== "==" && node.operator !== "!=") continue;
      const left = node.left as AstNode | undefined;
      const right = node.right as AstNode | undefined;
      const pair =
        (isBalanceOf(left) && numberLiteral(right) === "0") ||
        (isBalanceOf(right) && numberLiteral(left) === "0");
      if (pair)
        matches.push({
          node,
          message: "balanceOf() truncates sub-USDC dust, so a zero here may hide a non-zero native balance.",
        });
    }
    return matches;
  },
};
