import {
  childNodes,
  classifyCall,
  isAddressCast,
  isGlobalMember,
  memberAccess,
  numberLiteral,
} from "./ast.js";
import { applyConfig, type ResolvedConfig } from "./config.js";
import {
  type AnalysisError,
  type AstNode,
  compareFindings,
  type FileIndex,
  type Finding,
  type NodeInfo,
  type Position,
  type Report,
  type Rule,
  type RuleContext,
  type SuppressedFinding,
} from "./finding.js";
import { matchesAny } from "./glob.js";
import { type ParsedFile, parseSource } from "./parse.js";
import { DISCLAIMER, SOURCES_VERIFIED_AT } from "./sources.js";
import { VERSION } from "./version.js";

const LOOP_TYPES = new Set(["ForStatement", "WhileStatement", "DoWhileStatement"]);
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

export interface SourceInput {
  file: string;
  source: string;
}

export interface FileAnalysis {
  file: string;
  findings: Finding[];
  error?: AnalysisError;
}

function collect(ast: AstNode): Map<string, NodeInfo[]> {
  const buckets = new Map<string, NodeInfo[]>();
  const visit = (
    node: AstNode,
    parent: AstNode | undefined,
    contract: AstNode | undefined,
    fn: AstNode | undefined,
    loopDepth: number,
  ) => {
    const ownContract = node.type === "ContractDefinition" ? node : contract;
    const ownFn = node.type === "FunctionDefinition" || node.type === "ModifierDefinition" ? node : fn;
    const ownLoop = loopDepth + (LOOP_TYPES.has(node.type) ? 1 : 0);
    const info: NodeInfo = { node, parent, contract: ownContract, fn: ownFn, loopDepth };
    const bucket = buckets.get(node.type);
    if (bucket) bucket.push(info);
    else buckets.set(node.type, [info]);
    for (const child of childNodes(node)) visit(child, node, ownContract, ownFn, ownLoop);
  };
  visit(ast, undefined, undefined, undefined, 0);
  return buckets;
}

function isNativeAccount(node: AstNode): boolean {
  return isAddressCast(node) || isGlobalMember(node, "msg", "sender") || isGlobalMember(node, "tx", "origin");
}

function buildIndex(buckets: Map<string, NodeInfo[]>): FileIndex {
  const index: FileIndex = { addresses: [], tokenCalls: [], nativeUses: [], hasUsdcAddress: false };
  for (const info of buckets.get("NumberLiteral") ?? []) {
    const value = numberLiteral(info.node);
    if (value && /^0x[0-9a-f]{40}$/i.test(value)) {
      const lower = value.toLowerCase();
      index.addresses.push({ info, value: lower });
      if (lower === USDC_ADDRESS) index.hasUsdcAddress = true;
    }
  }
  for (const info of buckets.get("FunctionCall") ?? []) {
    const { kind, member } = classifyCall(info.node);
    if (kind === "token") index.tokenCalls.push({ info, member });
    if (kind === "native-send") index.nativeUses.push({ info, kind: "send" });
  }
  for (const info of buckets.get("MemberAccess") ?? []) {
    if (isGlobalMember(info.node, "msg", "value")) index.nativeUses.push({ info, kind: "msg.value" });
    else {
      const access = memberAccess(info.node);
      if (access && access.member === "balance" && isNativeAccount(access.object)) {
        index.nativeUses.push({ info, kind: "balance" });
      }
    }
  }
  return index;
}

function makeContext(parsed: ParsedFile): RuleContext {
  const buckets = collect(parsed.ast);
  const index = buildIndex(buckets);
  const lines = parsed.source.split(/\r?\n/);
  return {
    file: parsed.file,
    source: parsed.source,
    ast: parsed.ast,
    index,
    nodes: (type) => buckets.get(type) ?? [],
    position: (node) => positionOf(node),
    snippet: (node) => {
      const { line } = positionOf(node);
      return (lines[line - 1] ?? "").trim();
    },
  };
}

function positionOf(node: AstNode): Position {
  const start = node.loc?.start;
  return { line: start?.line ?? 0, column: (start?.column ?? -1) + 1 };
}

export function runRules(parsed: ParsedFile, rules: Rule[]): Finding[] {
  const context = makeContext(parsed);
  const findings: Finding[] = [];
  for (const rule of rules) {
    for (const match of rule.check(context)) {
      const { line, column } = context.position(match.node);
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        confidence: rule.confidence,
        file: parsed.file,
        line,
        column,
        snippet: context.snippet(match.node),
        message: match.message,
        suggestion: match.suggestion ?? rule.suggestion,
        docUrl: rule.docUrl,
      });
    }
  }
  return findings.sort(compareFindings);
}

export function analyzeFile(input: SourceInput, rules: Rule[]): FileAnalysis {
  const result = parseSource(input.file, input.source);
  if (!result.ok) return { file: input.file, findings: [], error: result.failure };
  return { file: input.file, findings: runRules(result.parsed, rules) };
}

export function analyze(inputs: SourceInput[], config: ResolvedConfig): Report {
  const findings: Finding[] = [];
  const suppressed: SuppressedFinding[] = [];
  const errors: AnalysisError[] = [];
  const sorted = inputs
    .filter((input) => !matchesAny(input.file, config.ignore))
    .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  for (const input of sorted) {
    const analysis = analyzeFile(input, config.rules);
    if (analysis.error) errors.push(analysis.error);
    for (const finding of analysis.findings) {
      const outcome = applyConfig(finding, config);
      if (outcome.kind === "drop") continue;
      if (outcome.kind === "suppress") suppressed.push(outcome.finding);
      else findings.push(outcome.finding);
    }
  }
  findings.sort(compareFindings);
  suppressed.sort(compareFindings);
  return {
    tool: { name: "arc-porter", version: VERSION },
    sourcesVerifiedAt: SOURCES_VERIFIED_AT,
    disclaimer: DISCLAIMER,
    summary: {
      files: sorted.length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      suppressed: suppressed.length,
    },
    findings,
    suppressed,
    errors,
  };
}
