import { readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import {
  analyze,
  defaultConfig,
  findRule,
  meetsThreshold,
  type Report,
  type ResolvedConfig,
  type Rule,
  renderJson,
  renderSarif,
  renderText,
  resolveConfig,
  rules,
  SEVERITIES,
  type Severity,
  validateConfig,
} from "@arc-porter/core";
import fg from "fast-glob";

export type Format = "text" | "json" | "sarif";
export const FORMATS: readonly Format[] = ["text", "json", "sarif"];

export interface CheckOptions {
  paths: string[];
  format: Format;
  failOn?: Severity;
  config?: string;
  output?: string;
  color: boolean;
  cwd: string;
}

export interface CheckOutcome {
  exitCode: 0 | 1 | 2;
  stdout: string;
  stderr: string;
  report?: Report;
}

export class UsageError extends Error {}

export function loadConfig(path: string | undefined, cwd: string): ResolvedConfig {
  if (!path) return defaultConfig(rules);
  const full = resolve(cwd, path);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(full, "utf8"));
  } catch (error) {
    throw new UsageError(`Could not read config ${path}: ${(error as Error).message}`);
  }
  const validation = validateConfig(
    raw,
    rules.map((rule) => rule.id),
  );
  if (!validation.ok) throw new UsageError(`Invalid config ${path}:\n  ${validation.errors.join("\n  ")}`);
  return resolveConfig(validation.config, rules);
}

export function discoverFiles(paths: string[], ignore: readonly string[], cwd: string): string[] {
  const patterns = (paths.length > 0 ? paths : ["."]).map((p) => {
    const normalized = p.replace(/\\/g, "/");
    if (fg.isDynamicPattern(normalized)) return normalized;
    if (normalized.endsWith(".sol")) return normalized;
    return `${normalized.replace(/\/$/, "")}/**/*.sol`;
  });
  const found = fg.sync(patterns, { cwd, ignore: [...ignore], onlyFiles: true, dot: false, unique: true });
  return found.map((file) => (isAbsolute(file) ? relative(cwd, file) : file)).sort();
}

export function render(report: Report, format: Format, color: boolean): string {
  if (format === "json") return renderJson(report);
  if (format === "sarif") return renderSarif(report, { rules });
  return renderText(report, { color });
}

export function check(options: CheckOptions): CheckOutcome {
  if (!FORMATS.includes(options.format)) {
    throw new UsageError(`Unknown format "${options.format}". Use ${FORMATS.join(", ")}.`);
  }
  if (options.failOn !== undefined && !SEVERITIES.includes(options.failOn)) {
    throw new UsageError(`Unknown --fail-on "${options.failOn}". Use ${SEVERITIES.join(", ")}.`);
  }
  const config = loadConfig(options.config, options.cwd);
  const failOn = options.failOn ?? config.failOn;
  const files = discoverFiles(options.paths, config.ignore, options.cwd);
  const inputs = files.map((file) => ({ file, source: readFileSync(resolve(options.cwd, file), "utf8") }));
  const report = analyze(inputs, { ...config, failOn });
  const text = render(report, options.format, options.color && options.format === "text");
  let stdout = text;
  let stderr = "";
  if (options.output) {
    writeFileSync(resolve(options.cwd, options.output), text);
    stdout = "";
    stderr += `Report written to ${options.output}\n`;
  }
  if (files.length === 0) stderr += "No Solidity files found.\n";
  const failing = report.findings.some((finding) => meetsThreshold(finding.severity, failOn));
  const exitCode: 0 | 1 | 2 = report.errors.length > 0 ? 2 : failing ? 1 : 0;
  return { exitCode, stdout, stderr, report };
}

export function listRules(format: "text" | "json"): string {
  if (format === "json") {
    return `${JSON.stringify(
      rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        title: rule.title,
        severity: rule.severity,
        confidence: rule.confidence,
        docUrl: rule.docUrl,
      })),
      null,
      2,
    )}\n`;
  }
  const lines = rules.map(
    (rule) =>
      `${rule.id}  ${rule.name.padEnd(28)} ${rule.severity.padEnd(7)} ${rule.confidence.padEnd(7)} ${rule.title}`,
  );
  return `${["ID     Rule                         Sev.    Conf.   Title", ...lines].join("\n")}\n`;
}

export function explainRule(id: string): string {
  const rule: Rule | undefined = findRule(id);
  if (!rule) throw new UsageError(`Unknown rule "${id}". Run "arc-porter rules" to list them.`);
  return [
    `${rule.id} ${rule.name}`,
    rule.title,
    "",
    `Severity: ${rule.severity}   Confidence: ${rule.confidence}`,
    "",
    rule.description,
    "",
    `Suggestion: ${rule.suggestion}`,
    "",
    "Bad:",
    indent(rule.badExample),
    "",
    "Good:",
    indent(rule.goodExample),
    "",
    `Source: ${rule.docUrl}`,
    ...rule.sources.filter((s) => !rule.docUrl.startsWith(s)).map((s) => `See also: ${s}`),
    "",
  ].join("\n");
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
}
