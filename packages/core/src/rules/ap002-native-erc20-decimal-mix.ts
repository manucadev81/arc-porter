import type { AstNode, NativeUse, Rule, TokenCall } from "../finding.js";
import { DOCS } from "../sources.js";

function byFunction<T extends { info: { fn: AstNode | undefined } }>(entries: T[]): Map<AstNode, T[]> {
  const groups = new Map<AstNode, T[]>();
  for (const entry of entries) {
    const fn = entry.info.fn;
    if (!fn) continue;
    const group = groups.get(fn);
    if (group) group.push(entry);
    else groups.set(fn, [entry]);
  }
  return groups;
}

const READ_OR_MOVE = new Set(["balanceOf", "transfer", "transferFrom", "safeTransfer", "safeTransferFrom"]);

export const ap002: Rule = {
  id: "AP002",
  name: "native-erc20-decimal-mix",
  title: "Native value and ERC-20 USDC mixed in one function",
  severity: "high",
  confidence: "medium",
  docUrl: `${DOCS.stablecoinModel}#two-interfaces-one-balance`,
  sources: [DOCS.stablecoinModel, DOCS.porting, DOCS.evmDifferences],
  description:
    "On Arc msg.value and address.balance are denominated in 18-decimal native USDC, while balanceOf, transfer and transferFrom on the USDC contract use 6 decimals over the same balance. A function that reads or moves both is off by a factor of 10^12 unless it converts.",
  suggestion:
    "Pick one interface per function. If both are needed, convert explicitly: native = erc20 * 10**12, and never compare or add raw values.",
  badExample: `interface IERC20 {
    function balanceOf(address) external view returns (uint256);
}

contract Pool {
    IERC20 usdc;

    function deposit() external payable {
        require(msg.value <= usdc.balanceOf(msg.sender));
    }
}`,
  goodExample: `interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transferFrom(address, address, uint256) external returns (bool);
}

contract Pool {
    IERC20 usdc;
    mapping(address => uint256) public deposits;

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }

    function depositNative() external payable {
        deposits[msg.sender] += msg.value / 1e12;
    }
}`,
  check(context) {
    const natives = byFunction<NativeUse>(
      context.index.nativeUses.filter((use) => use.kind === "msg.value" || use.kind === "balance"),
    );
    const tokens = byFunction<TokenCall>(
      context.index.tokenCalls.filter((call) => READ_OR_MOVE.has(call.member)),
    );
    const matches = [];
    for (const [fn, nativeUses] of natives) {
      const tokenCalls = tokens.get(fn);
      if (!tokenCalls || tokenCalls.length === 0) continue;
      const first = nativeUses[0];
      const token = tokenCalls[0];
      if (!first || !token) continue;
      const name = typeof fn.name === "string" && fn.name ? fn.name : "this function";
      matches.push({
        node: first.info.node,
        message: `${name} reads native value (${first.kind === "msg.value" ? "msg.value" : ".balance"}, 18 decimals on Arc) and calls ${token.member} on a token in the same function; if that token is USDC, the two views differ by 10^12.`,
      });
    }
    return matches;
  },
};
