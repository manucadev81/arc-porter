import type { AstNode } from "./finding.js";

export function isNode(value: unknown): value is AstNode {
  return (
    typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string"
  );
}

export function childNodes(node: AstNode): AstNode[] {
  const out: AstNode[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "range") continue;
    if (isNode(value)) out.push(value);
    else if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) out.push(item);
    }
  }
  return out;
}

export function memberAccess(node: AstNode): { object: AstNode; member: string } | undefined {
  if (node.type !== "MemberAccess") return undefined;
  const object = node.expression;
  const member = node.memberName;
  if (!isNode(object) || typeof member !== "string") return undefined;
  return { object, member };
}

export function identifierName(node: AstNode | undefined): string | undefined {
  if (node?.type !== "Identifier") return undefined;
  return typeof node.name === "string" ? node.name : undefined;
}

export function isGlobalMember(node: AstNode, object: string, member: string): boolean {
  const access = memberAccess(node);
  return access !== undefined && access.member === member && identifierName(access.object) === object;
}

export function callee(node: AstNode): AstNode | undefined {
  if (node.type !== "FunctionCall") return undefined;
  let expression = node.expression;
  if (isNode(expression) && expression.type === "NameValueExpression") expression = expression.expression;
  return isNode(expression) ? expression : undefined;
}

export function callArguments(node: AstNode): AstNode[] {
  const args = node.arguments;
  return Array.isArray(args) ? args.filter(isNode) : [];
}

export function callOptions(node: AstNode): { names: string[]; values: AstNode[] } {
  const expression = node.expression;
  if (!isNode(expression) || expression.type !== "NameValueExpression") return { names: [], values: [] };
  const list = expression.arguments;
  if (!isNode(list)) return { names: [], values: [] };
  const names = Array.isArray(list.names) ? list.names.filter((n): n is string => typeof n === "string") : [];
  const values = Array.isArray(list.arguments) ? list.arguments.filter(isNode) : [];
  return { names, values };
}

export function hasValueOption(node: AstNode): boolean {
  return callOptions(node).names.includes("value");
}

export function numberLiteral(node: AstNode | undefined): string | undefined {
  if (node?.type !== "NumberLiteral") return undefined;
  return typeof node.number === "string" ? node.number : undefined;
}

export function subdenomination(node: AstNode | undefined): string | undefined {
  if (node?.type !== "NumberLiteral") return undefined;
  return typeof node.subdenomination === "string" ? node.subdenomination : undefined;
}

export function castName(node: AstNode | undefined): string | undefined {
  if (node?.type !== "FunctionCall") return undefined;
  const target = callee(node);
  if (!target || callArguments(node).length !== 1) return undefined;
  if (target.type === "ElementaryTypeName" && typeof target.name === "string") return target.name;
  const name = identifierName(target);
  return name === "address" || name === "payable" ? name : undefined;
}

export function castArgument(node: AstNode): AstNode | undefined {
  return callArguments(node)[0];
}

export function isZeroAddress(node: AstNode | undefined): boolean {
  if (!node) return false;
  const cast = castName(node);
  if (cast === "address" || cast === "payable") {
    const inner = castArgument(node);
    return numberLiteral(inner) === "0" || isZeroAddress(inner);
  }
  const literal = numberLiteral(node);
  return literal !== undefined && /^0x0{40}$/i.test(literal);
}

export function isThisBalance(node: AstNode | undefined): boolean {
  if (!node) return false;
  const access = memberAccess(node);
  if (access?.member !== "balance") return false;
  return castName(access.object) === "address" && identifierName(castArgument(access.object)) === "this";
}

export function isAddressCast(node: AstNode | undefined): boolean {
  const cast = castName(node);
  return cast === "address" || cast === "payable";
}

export function containsNode(root: AstNode, predicate: (node: AstNode) => boolean): boolean {
  if (predicate(root)) return true;
  for (const child of childNodes(root)) if (containsNode(child, predicate)) return true;
  return false;
}

export const TOKEN_MEMBERS = new Set([
  "transfer",
  "transferFrom",
  "balanceOf",
  "approve",
  "safeTransfer",
  "safeTransferFrom",
]);

export type CallKind = "native-send" | "token" | "other";

export function classifyCall(node: AstNode): { kind: CallKind; member: string } {
  const target = callee(node);
  if (!target) return { kind: "other", member: "" };
  const access = memberAccess(target);
  if (!access) return { kind: "other", member: "" };
  const count = callArguments(node).length;
  const { member } = access;
  if (member === "call" && hasValueOption(node)) return { kind: "native-send", member };
  if ((member === "transfer" || member === "send") && count === 1) return { kind: "native-send", member };
  if (member === "transfer" && count === 2) return { kind: "token", member };
  if (member === "safeTransfer" && (count === 2 || count === 3)) return { kind: "token", member };
  if (member === "transferFrom" && count === 3) return { kind: "token", member };
  if (member === "safeTransferFrom" && (count === 3 || count === 4)) return { kind: "token", member };
  if (member === "balanceOf" && count === 1) return { kind: "token", member };
  if (member === "approve" && count === 2) return { kind: "token", member };
  return { kind: "other", member };
}

export function recipientOf(node: AstNode): AstNode | undefined {
  const { kind, member } = classifyCall(node);
  const args = callArguments(node);
  if (kind === "native-send") {
    const target = callee(node);
    const access = target ? memberAccess(target) : undefined;
    return access?.object;
  }
  if (kind !== "token") return undefined;
  if (member === "transfer") return args[0];
  if (member === "safeTransfer") return args.length === 3 ? args[1] : args[0];
  if (member === "transferFrom") return args[1];
  if (member === "safeTransferFrom") return args.length === 4 ? args[2] : args[1];
  return undefined;
}

export function sentValueOf(node: AstNode): AstNode | undefined {
  const { kind, member } = classifyCall(node);
  if (kind !== "native-send") return undefined;
  if (member === "call") {
    const { names, values } = callOptions(node);
    const at = names.indexOf("value");
    return at >= 0 ? values[at] : undefined;
  }
  return callArguments(node)[0];
}
