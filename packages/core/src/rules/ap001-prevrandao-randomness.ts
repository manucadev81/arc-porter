import { isGlobalMember } from "../ast.js";
import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const ap001: Rule = {
  id: "AP001",
  name: "prevrandao-randomness",
  title: "block.prevrandao is always 0 on Arc",
  severity: "high",
  confidence: "high",
  docUrl: `${DOCS.evmDifferences}#execution-and-opcode-differences`,
  sources: [DOCS.evmDifferences, DOCS.porting],
  description:
    "On Arc the PREVRANDAO opcode always returns 0, so block.prevrandao (and its legacy alias block.difficulty) never carries randomness. Lotteries, shuffles and relay selection built on it always get the same value.",
  suggestion: "Use a verifiable random function or a randomness oracle instead of block.prevrandao.",
  badExample: `contract Raffle {
    function pick(uint256 entries) external view returns (uint256) {
        return block.prevrandao % entries;
    }
}`,
  goodExample: `interface IRandomness {
    function latest() external view returns (uint256);
}

contract Raffle {
    IRandomness immutable oracle;

    constructor(IRandomness oracle_) {
        oracle = oracle_;
    }

    function pick(uint256 entries) external view returns (uint256) {
        return oracle.latest() % entries;
    }
}`,
  check(context) {
    const matches = [];
    for (const { node } of context.nodes("MemberAccess")) {
      if (isGlobalMember(node, "block", "prevrandao")) {
        matches.push({ node, message: "block.prevrandao always returns 0 on Arc." });
      } else if (isGlobalMember(node, "block", "difficulty")) {
        matches.push({
          node,
          message: "block.difficulty maps to PREVRANDAO, which always returns 0 on Arc.",
        });
      }
    }
    return matches;
  },
};
