import { callee, identifierName } from "../ast.js";
import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const ap006: Rule = {
  id: "AP006",
  name: "selfdestruct-usage",
  title: "selfdestruct moves USDC and reverts in several cases on Arc",
  severity: "high",
  confidence: "high",
  docUrl: `${DOCS.evmDifferences}#selfdestruct`,
  sources: [DOCS.evmDifferences, DOCS.porting],
  description:
    "On Arc a contract's USDC is its native balance, so selfdestruct transfers that USDC to the beneficiary. It reverts when the beneficiary is the contract itself, the zero address, a blocklisted address or an account that already self-destructed, and any later non-zero-value call to the destructed account reverts.",
  suggestion:
    "Remove selfdestruct. Move funds out with an explicit withdrawal and disable the contract with a flag.",
  badExample: `contract Closable {
    address immutable owner = msg.sender;

    function close() external {
        require(msg.sender == owner);
        selfdestruct(payable(owner));
    }
}`,
  goodExample: `contract Closable {
    address immutable owner = msg.sender;
    bool public closed;

    function close() external {
        require(msg.sender == owner);
        closed = true;
        payable(owner).transfer(address(this).balance);
    }
}`,
  check(context) {
    const matches = [];
    for (const { node } of context.nodes("FunctionCall")) {
      if (identifierName(callee(node)) === "selfdestruct") {
        matches.push({
          node,
          message: "selfdestruct follows Arc's native value rules and moves the contract's USDC.",
        });
      }
    }
    return matches;
  },
};
