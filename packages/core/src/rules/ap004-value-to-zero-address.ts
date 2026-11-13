import { classifyCall, isZeroAddress, isZeroLiteral, recipientOf, sentValueOf } from "../ast.js";
import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const ap004: Rule = {
  id: "AP004",
  name: "value-to-zero-address",
  title: "Value sent to address(0) reverts on Arc",
  severity: "high",
  confidence: "high",
  docUrl: `${DOCS.evmDifferences}#value-transfer-rules`,
  sources: [DOCS.evmDifferences, DOCS.porting],
  description:
    'A value-bearing transfer to the zero address reverts on Arc with "Zero address not allowed". Because USDC is the native asset and the ERC-20 interface moves the same balance, sending tokens to address(0) as a burn also fails.',
  suggestion:
    "Never send value or USDC to address(0). To retire funds, send them to an address you control and account for them there.",
  badExample: `contract Burner {
    function burn() external payable {
        payable(address(0)).transfer(msg.value);
    }
}`,
  goodExample: `contract Treasury {
    address public immutable vault;

    constructor(address vault_) {
        require(vault_ != address(0));
        vault = vault_;
    }

    function retire() external payable {
        payable(vault).transfer(msg.value);
    }
}`,
  check(context) {
    const matches = [];
    for (const { node } of context.nodes("FunctionCall")) {
      const { kind } = classifyCall(node);
      if (kind === "other") continue;
      const recipient = recipientOf(node);
      if (!isZeroAddress(recipient)) continue;
      if (kind === "native-send" && isZeroLiteral(sentValueOf(node))) continue;
      matches.push({
        node,
        message:
          kind === "native-send"
            ? "Native value sent to address(0) reverts on Arc."
            : "USDC transferred to address(0) reverts on Arc, because the ERC-20 interface moves the native balance.",
      });
    }
    return matches;
  },
};
