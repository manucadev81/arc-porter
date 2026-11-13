import { isGlobalMember } from "../ast.js";
import type { AstNode, Rule } from "../finding.js";
import { DOCS } from "../sources.js";

const STORED_TIME = /(last|prev|previous|latest)/i;
const TIME_WORD = /(time|stamp|block)/i;
const NOT_A_CLOCK = /(deadline|expir|start|end|unlock|until|cliff|period|duration|delay|cooldown)/i;

function referenceName(node: AstNode | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "Identifier" && typeof node.name === "string") return node.name;
  if (node.type === "MemberAccess" && typeof node.memberName === "string") return node.memberName;
  if (node.type === "IndexAccess") return referenceName(node.base as AstNode | undefined);
  return undefined;
}

function looksLikeStoredTimestamp(name: string | undefined): boolean {
  if (!name || NOT_A_CLOCK.test(name)) return false;
  return STORED_TIME.test(name) && TIME_WORD.test(name);
}

export const ap013: Rule = {
  id: "AP013",
  name: "timestamp-strict-ordering",
  title: "block.timestamp may repeat across blocks on Arc",
  severity: "low",
  confidence: "low",
  docUrl: `${DOCS.evmDifferences}#fee-market-and-block-behavior`,
  sources: [DOCS.evmDifferences],
  description:
    "Arc produces sub-second blocks with one-second timestamp granularity, so consecutive blocks can share a timestamp. Requiring block.timestamp to be strictly greater than the last recorded timestamp can reject a later block.",
  suggestion: "Order by block.number, or compare with >= when a repeated timestamp is acceptable.",
  badExample: `contract Heartbeat {
    uint256 public lastTimestamp;

    function beat() external {
        require(block.timestamp > lastTimestamp);
        lastTimestamp = block.timestamp;
    }
}`,
  goodExample: `contract Heartbeat {
    uint256 public lastBlock;

    function beat() external {
        require(block.number > lastBlock);
        lastBlock = block.number;
    }
}`,
  check(context) {
    const matches = [];
    for (const { node } of context.nodes("BinaryOperation")) {
      const left = node.left as AstNode | undefined;
      const right = node.right as AstNode | undefined;
      if (!left || !right) continue;
      const stored =
        node.operator === ">" && isGlobalMember(left, "block", "timestamp")
          ? right
          : node.operator === "<" && isGlobalMember(right, "block", "timestamp")
            ? left
            : undefined;
      if (!stored || !looksLikeStoredTimestamp(referenceName(stored))) continue;
      matches.push({
        node,
        message:
          "block.timestamp can equal the previous block's timestamp on Arc, so this strict comparison can fail for a later block.",
      });
    }
    return matches;
  },
};
