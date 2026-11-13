import { type Finding, type Rule, SEVERITY_ORDER, type Severity, type SuppressedFinding } from "./finding.js";
import { matchesAny, matchesGlob } from "./glob.js";

export const SEVERITIES: readonly Severity[] = ["low", "medium", "high"];
export const DEFAULT_IGNORE: readonly string[] = [
  "**/lib/**",
  "**/node_modules/**",
  "**/out/**",
  "**/cache/**",
];

export type RuleSetting = "on" | "off" | Severity;

export interface Suppression {
  rule: string;
  file: string;
  reason: string;
  line?: number;
}

export interface UserConfig {
  failOn?: Severity;
  ignore?: string[];
  rules?: Record<string, RuleSetting>;
  suppressions?: Suppression[];
}

export interface ResolvedConfig {
  failOn: Severity;
  ignore: string[];
  rules: Rule[];
  suppressions: Suppression[];
}

export type ConfigValidation = { ok: true; config: UserConfig } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateConfig(raw: unknown, knownRuleIds: readonly string[]): ConfigValidation {
  const errors: string[] = [];
  if (!isRecord(raw)) return { ok: false, errors: ["config must be a JSON object"] };
  const config: UserConfig = {};
  const allowed = new Set(["failOn", "ignore", "rules", "suppressions"]);
  for (const key of Object.keys(raw)) if (!allowed.has(key)) errors.push(`unknown field "${key}"`);

  if (raw.failOn !== undefined) {
    if (typeof raw.failOn === "string" && (SEVERITIES as string[]).includes(raw.failOn)) {
      config.failOn = raw.failOn as Severity;
    } else errors.push('"failOn" must be "low", "medium" or "high"');
  }

  if (raw.ignore !== undefined) {
    if (Array.isArray(raw.ignore) && raw.ignore.every((p) => typeof p === "string")) {
      config.ignore = raw.ignore as string[];
    } else errors.push('"ignore" must be an array of glob strings');
  }

  if (raw.rules !== undefined) {
    if (!isRecord(raw.rules)) errors.push('"rules" must be an object keyed by rule id');
    else {
      const rules: Record<string, RuleSetting> = {};
      for (const [rawId, setting] of Object.entries(raw.rules)) {
        const id = rawId.toUpperCase();
        if (!knownRuleIds.includes(id)) errors.push(`"rules.${rawId}": unknown rule`);
        if (
          typeof setting === "string" &&
          (setting === "on" || setting === "off" || (SEVERITIES as string[]).includes(setting))
        ) {
          rules[id] = setting as RuleSetting;
        } else errors.push(`"rules.${rawId}" must be "on", "off", "low", "medium" or "high"`);
      }
      config.rules = rules;
    }
  }

  if (raw.suppressions !== undefined) {
    if (!Array.isArray(raw.suppressions)) errors.push('"suppressions" must be an array');
    else {
      const suppressions: Suppression[] = [];
      raw.suppressions.forEach((entry, at) => {
        const where = `"suppressions[${at}]"`;
        if (!isRecord(entry)) {
          errors.push(`${where} must be an object`);
          return;
        }
        const rule = typeof entry.rule === "string" ? entry.rule.toUpperCase() : entry.rule;
        const file = entry.file;
        const reason = entry.reason;
        const line = entry.line;
        if (typeof rule !== "string" || !knownRuleIds.includes(rule)) {
          errors.push(`${where}.rule must be a known rule id`);
        }
        if (typeof file !== "string" || file.length === 0)
          errors.push(`${where}.file must be a path or glob`);
        if (typeof reason !== "string" || reason.trim().length === 0) {
          errors.push(`${where}.reason is required: say why the finding is accepted`);
        }
        if (line !== undefined && (typeof line !== "number" || !Number.isInteger(line) || line < 1)) {
          errors.push(`${where}.line must be a positive integer`);
        }
        if (typeof rule === "string" && typeof file === "string" && typeof reason === "string") {
          const suppression: Suppression = { rule, file, reason: reason.trim() };
          if (typeof line === "number") suppression.line = line;
          suppressions.push(suppression);
        }
      });
      config.suppressions = suppressions;
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, config };
}

export function resolveConfig(user: UserConfig, allRules: readonly Rule[]): ResolvedConfig {
  const settings = user.rules ?? {};
  const rules: Rule[] = [];
  for (const rule of allRules) {
    const setting = settings[rule.id];
    if (setting === "off") continue;
    if (setting === undefined || setting === "on") rules.push(rule);
    else rules.push({ ...rule, severity: setting });
  }
  return {
    failOn: user.failOn ?? "high",
    ignore: [...DEFAULT_IGNORE, ...(user.ignore ?? [])],
    rules,
    suppressions: user.suppressions ?? [],
  };
}

export function defaultConfig(allRules: readonly Rule[]): ResolvedConfig {
  return resolveConfig({}, allRules);
}

export type ConfigOutcome =
  | { kind: "keep"; finding: Finding }
  | { kind: "suppress"; finding: SuppressedFinding }
  | { kind: "drop" };

export function applyConfig(finding: Finding, config: ResolvedConfig): ConfigOutcome {
  if (matchesAny(finding.file, config.ignore)) return { kind: "drop" };
  const suppression = config.suppressions.find(
    (s) =>
      s.rule === finding.ruleId &&
      matchesGlob(finding.file, s.file) &&
      (s.line === undefined || s.line === finding.line),
  );
  if (suppression) return { kind: "suppress", finding: { ...finding, reason: suppression.reason } };
  return { kind: "keep", finding };
}

export function meetsThreshold(severity: Severity, failOn: Severity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[failOn];
}
