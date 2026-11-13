export type Severity = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export const SEVERITY_ORDER: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

export interface Finding {
  ruleId: string;
  severity: Severity;
  confidence: Confidence;
  file: string;
  line: number;
  column: number;
  snippet: string;
  message: string;
  suggestion: string;
  docUrl: string;
}

export interface SuppressedFinding extends Finding {
  reason: string;
}

export interface AnalysisError {
  file: string;
  message: string;
}

export interface Report {
  tool: { name: "arc-porter"; version: string };
  sourcesVerifiedAt: string;
  disclaimer: string;
  summary: { files: number; high: number; medium: number; low: number; suppressed: number };
  findings: Finding[];
  suppressed: SuppressedFinding[];
  errors: AnalysisError[];
}

export interface Position {
  line: number;
  column: number;
}

export interface SourceSpan {
  start: Position;
  end: Position;
}

export interface AstNode {
  type: string;
  loc?: SourceSpan;
  range?: [number, number];
  [key: string]: unknown;
}

export interface NodeInfo {
  node: AstNode;
  parent: AstNode | undefined;
  contract: AstNode | undefined;
  fn: AstNode | undefined;
  loopDepth: number;
}

export interface TokenCall {
  info: NodeInfo;
  member: string;
}

export interface NativeUse {
  info: NodeInfo;
  kind: "msg.value" | "balance" | "send";
}

export interface FileIndex {
  addresses: { info: NodeInfo; value: string }[];
  tokenCalls: TokenCall[];
  nativeUses: NativeUse[];
  hasUsdcAddress: boolean;
}

export interface RuleContext {
  file: string;
  source: string;
  ast: AstNode;
  index: FileIndex;
  nodes(type: string): NodeInfo[];
  snippet(node: AstNode): string;
  position(node: AstNode): Position;
}

export interface Rule {
  id: string;
  name: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  docUrl: string;
  sources: string[];
  description: string;
  suggestion: string;
  badExample: string;
  goodExample: string;
  check(context: RuleContext): RuleMatch[];
}

export interface RuleMatch {
  node: AstNode;
  message: string;
  suggestion?: string;
}

export function compareFindings(a: Finding, b: Finding): number {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  if (a.line !== b.line) return a.line - b.line;
  if (a.column !== b.column) return a.column - b.column;
  if (a.ruleId !== b.ruleId) return a.ruleId < b.ruleId ? -1 : 1;
  return 0;
}
