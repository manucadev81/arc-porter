export type { ConfigValidation, ResolvedConfig, RuleSetting, Suppression, UserConfig } from "./config.js";
export {
  applyConfig,
  DEFAULT_IGNORE,
  defaultConfig,
  meetsThreshold,
  resolveConfig,
  SEVERITIES,
  validateConfig,
} from "./config.js";
export type { FileAnalysis, SourceInput } from "./engine.js";
export { analyze, analyzeFile, runRules, USDC_ADDRESS } from "./engine.js";
export type {
  AnalysisError,
  AstNode,
  Confidence,
  FileIndex,
  Finding,
  NodeInfo,
  Report,
  Rule,
  RuleContext,
  RuleMatch,
  Severity,
  SuppressedFinding,
} from "./finding.js";
export { compareFindings, SEVERITY_ORDER } from "./finding.js";
export { matchesAny, matchesGlob } from "./glob.js";
export type { ParsedFile, ParseFailure, ParseResult } from "./parse.js";
export { parseSource } from "./parse.js";
export type { TextOptions } from "./report/text.js";
export { renderText } from "./report/text.js";
export { findRule, ruleIds, rules } from "./rules/index.js";
export type { DocSource } from "./sources.js";
export { DISCLAIMER, DOCS, SOURCE_LIST, SOURCES_VERIFIED_AT } from "./sources.js";
export { VERSION } from "./version.js";
