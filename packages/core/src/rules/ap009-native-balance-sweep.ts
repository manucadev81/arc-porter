import { classifyCall, isThisBalance, sentValueOf } from "../ast.js";
import type { AstNode, Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const ap009: Rule = {
  id: "AP009",
  name: "native-balance-sweep",
  title: "Native sweep in a contract that also holds ERC-20 USDC",
  severity: "high",
  confidence: "medium",
  docUrl: `${DOCS.porting}#steps`,
  sources: [DOCS.porting, DOCS.stablecoinModel],
  description:
    "On Arc the ERC-20 USDC a contract holds is its native balance. A function that sends address(this).balance also moves the users' ERC-20 USDC, so a contract that handles tokens must not sweep its native balance.",
  suggestion:
    "Track what the contract owes in storage and transfer only the surplus, or remove the sweep from contracts that custody ERC-20 USDC.",
  badExample: `interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
}

contract Vault {
    IERC20 usdc;
    address owner;

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
    }

    function sweep() external {
        payable(owner).transfer(address(this).balance);
    }
}`,
  goodExample: `interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}

contract Vault {
    IERC20 usdc;
    address owner;
    uint256 public owed;

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        owed += amount;
    }

    function sweepSurplus(uint256 held) external {
        usdc.transfer(owner, held - owed);
    }
}`,
  check(context) {
    const tokenContracts = new Set<AstNode>();
    for (const call of context.index.tokenCalls)
      if (call.info.contract) tokenContracts.add(call.info.contract);
    const matches = [];
    for (const info of context.nodes("FunctionCall")) {
      if (classifyCall(info.node).kind !== "native-send") continue;
      if (!isThisBalance(sentValueOf(info.node))) continue;
      if (!info.contract || !tokenContracts.has(info.contract)) continue;
      matches.push({
        node: info.node,
        message:
          "Sweeping address(this).balance here also moves the ERC-20 USDC this contract holds for others.",
      });
    }
    return matches;
  },
};
