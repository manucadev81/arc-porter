import { callArguments, callee, hasValueOption, memberAccess } from "../ast.js";
import type { AstNode, Rule, RuleMatch } from "../finding.js";
import { DOCS } from "../sources.js";

const WRAPPED = /^I?W(ETH|USDC)\d*$/;

function nameOf(node: AstNode): string | undefined {
  if (node.type === "Identifier" && typeof node.name === "string") return node.name;
  if (node.type === "UserDefinedTypeName" && typeof node.namePath === "string") return node.namePath;
  if (node.type === "ContractDefinition" && typeof node.name === "string") return node.name;
  if (node.type === "VariableDeclaration" && typeof node.name === "string") return node.name;
  if (node.type === "ImportDirective" && typeof node.path === "string")
    return node.path.replace(/^.*\//, "").replace(/\.sol$/, "");
  return undefined;
}

export const ap007: Rule = {
  id: "AP007",
  name: "wrapped-native-pattern",
  title: "WETH-style wrapper has no place on Arc",
  severity: "medium",
  confidence: "medium",
  docUrl: `${DOCS.porting}#steps`,
  sources: [DOCS.porting, DOCS.stablecoinModel, DOCS.contractAddresses],
  description:
    "Arc's native asset already exposes an ERC-20 interface, so there is no wrapped native token and no WUSDC. Code that names WETH or WUSDC, or wraps with deposit{value:} and unwraps with withdraw(), carries a step that does not exist on Arc and fragments liquidity if deployed.",
  suggestion:
    "Replace the WETH constant with the USDC ERC-20 address 0x3600000000000000000000000000000000000000 and remove deposit() and withdraw() wrap calls.",
  badExample: `interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract Router {
    IWETH immutable WETH;

    constructor(IWETH weth) {
        WETH = weth;
    }

    function wrap() external payable {
        WETH.deposit{value: msg.value}();
    }
}`,
  goodExample: `interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
}

contract Router {
    IERC20 constant USDC = IERC20(0x3600000000000000000000000000000000000000);

    function pull(uint256 amount) external {
        USDC.transferFrom(msg.sender, address(this), amount);
    }
}`,
  check(context) {
    const matches: RuleMatch[] = [];
    const seenLines = new Set<number>();
    const push = (node: AstNode, message: string) => {
      const line = context.position(node).line;
      if (seenLines.has(line)) return;
      seenLines.add(line);
      matches.push({ node, message });
    };
    for (const type of ["ContractDefinition", "VariableDeclaration", "ImportDirective"]) {
      for (const { node } of context.nodes(type)) {
        const name = nameOf(node);
        if (name && WRAPPED.test(name))
          push(node, `${name} refers to a wrapped native token, which Arc does not have.`);
      }
    }
    if (matches.length === 0) {
      for (const type of ["UserDefinedTypeName", "Identifier"]) {
        const first = context.nodes(type).find(({ node }) => {
          const name = nameOf(node);
          return name !== undefined && WRAPPED.test(name);
        });
        if (first) {
          push(
            first.node,
            `${nameOf(first.node)} refers to a wrapped native token, which Arc does not have.`,
          );
          break;
        }
      }
    }
    let deposit: AstNode | undefined;
    let withdraw = false;
    for (const { node } of context.nodes("FunctionCall")) {
      const target = callee(node);
      const access = target ? memberAccess(target) : undefined;
      if (!access) continue;
      if (access.member === "deposit" && hasValueOption(node) && callArguments(node).length === 0)
        deposit ??= node;
      if (access.member === "withdraw" && callArguments(node).length === 1) withdraw = true;
    }
    if (deposit && withdraw)
      push(deposit, "deposit{value:} paired with withdraw(amount) is the WETH wrap and unwrap pattern.");
    return matches;
  },
};
