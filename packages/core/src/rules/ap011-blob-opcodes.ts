import { assemblyCalls, callee, identifierName, isGlobalMember } from "../ast.js";
import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const ap011: Rule = {
  id: "AP011",
  name: "blob-opcodes",
  title: "Blob opcodes return fixed values on Arc",
  severity: "medium",
  confidence: "high",
  docUrl: `${DOCS.evmDifferences}#execution-and-opcode-differences`,
  sources: [DOCS.evmDifferences],
  description:
    "Arc does not support blob transactions. BLOBHASH always returns 0 and BLOBBASEFEE always returns 1, so code that reads blobhash(i) or block.blobbasefee gets constants instead of chain data.",
  suggestion: "Remove the dependency on blob data; Arc rejects type-3 transactions at the mempool.",
  badExample: `contract BlobReader {
    function first() external view returns (bytes32) {
        return blobhash(0);
    }

    function fee() external view returns (uint256) {
        return block.blobbasefee;
    }
}`,
  goodExample: `contract FeeReader {
    function fee() external view returns (uint256) {
        return block.basefee;
    }
}`,
  check(context) {
    const matches = [];
    for (const { node } of context.nodes("FunctionCall")) {
      if (identifierName(callee(node)) === "blobhash") {
        matches.push({ node, message: "blobhash() always returns 0 on Arc." });
      }
    }
    for (const { node } of context.nodes("MemberAccess")) {
      if (isGlobalMember(node, "block", "blobbasefee")) {
        matches.push({ node, message: "block.blobbasefee always returns 1 on Arc." });
      }
    }
    for (const node of assemblyCalls(context.ast, "blobhash")) {
      matches.push({ node, message: "blobhash() in inline assembly always returns 0 on Arc." });
    }
    for (const node of assemblyCalls(context.ast, "blobbasefee")) {
      matches.push({ node, message: "blobbasefee() in inline assembly always returns 1 on Arc." });
    }
    return matches;
  },
};
