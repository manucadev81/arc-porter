import { classifyCall } from "../ast.js";
import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const ap005: Rule = {
  id: "AP005",
  name: "push-payment-loop",
  title: "Transfer inside a loop can be blocked by one recipient",
  severity: "medium",
  confidence: "high",
  docUrl: `${DOCS.porting}#steps`,
  sources: [DOCS.porting, DOCS.evmDifferences],
  description:
    "On Arc a USDC transfer can revert even when the sender has the balance: the recipient may be blocklisted, the zero address or a self-destructed account. A loop that pushes value to several recipients fails for everyone when one of them reverts. This rule is derived from the value-transfer and revert-path steps of the porting guide; the guide does not name loops explicitly.",
  suggestion:
    "Credit each recipient in storage and let them withdraw individually, so one address that cannot receive USDC does not block the others.",
  badExample: `contract Splitter {
    function split(address payable[] calldata to) external payable {
        for (uint256 i; i < to.length; i++) {
            to[i].transfer(msg.value / to.length);
        }
    }
}`,
  goodExample: `contract Splitter {
    mapping(address => uint256) public claimable;

    function split(address[] calldata to) external payable {
        for (uint256 i; i < to.length; i++) {
            claimable[to[i]] += msg.value / to.length;
        }
    }

    function withdraw() external {
        uint256 amount = claimable[msg.sender];
        claimable[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}`,
  check(context) {
    const matches = [];
    for (const info of context.nodes("FunctionCall")) {
      if (info.loopDepth === 0) continue;
      const { kind, member } = classifyCall(info.node);
      if (kind === "native-send") {
        matches.push({
          node: info.node,
          message: `Native ${member} inside a loop: one blocked recipient reverts the whole batch.`,
        });
      } else if (kind === "token" && member !== "balanceOf" && member !== "approve") {
        matches.push({
          node: info.node,
          message: `USDC ${member} inside a loop: one blocked recipient reverts the whole batch.`,
        });
      }
    }
    return matches;
  },
};
