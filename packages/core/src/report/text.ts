import type { Finding, Report, Severity } from "../finding.js";

export interface TextOptions {
  color?: boolean;
}

const LABEL: Record<Severity, string> = { high: "HIGH", medium: "MEDIUM", low: "LOW" };
const COLOR: Record<Severity, string> = { high: "\u001b[31m", medium: "\u001b[33m", low: "\u001b[36m" };
const RESET = "\u001b[0m";
const DIM = "\u001b[2m";
const BOLD = "\u001b[1m";

function paint(text: string, code: string, enabled: boolean): string {
  return enabled ? `${code}${text}${RESET}` : text;
}

function formatFinding(finding: Finding, color: boolean): string[] {
  const head = `${paint(LABEL[finding.severity], COLOR[finding.severity], color)} ${paint(finding.ruleId, BOLD, color)} ${finding.message}`;
  return [
    head,
    `  ${finding.file}:${finding.line}:${finding.column}  ${paint(`confidence ${finding.confidence}`, DIM, color)}`,
    `  ${finding.snippet}`,
    `  ${paint("Suggestion:", DIM, color)} ${finding.suggestion}`,
    `  ${paint("Docs:", DIM, color)} ${finding.docUrl}`,
    "",
  ];
}

export function renderText(report: Report, options: TextOptions = {}): string {
  const color = options.color ?? false;
  const lines: string[] = [];
  lines.push(
    `${paint(`arc-porter ${report.tool.version}`, BOLD, color)}  ${report.summary.files} file(s) analyzed`,
  );
  lines.push("");
  for (const finding of report.findings) lines.push(...formatFinding(finding, color));
  if (report.suppressed.length > 0) {
    lines.push(paint("Suppressed", BOLD, color));
    for (const finding of report.suppressed) {
      lines.push(`  ${finding.ruleId} ${finding.file}:${finding.line}  ${finding.reason}`);
    }
    lines.push("");
  }
  if (report.errors.length > 0) {
    lines.push(paint("Errors", BOLD, color));
    for (const error of report.errors) lines.push(`  ${error.file}: ${error.message}`);
    lines.push("");
  }
  const { high, medium, low, suppressed } = report.summary;
  lines.push(
    `${paint("Summary:", BOLD, color)} ${high} high, ${medium} medium, ${low} low` +
      (suppressed > 0 ? `, ${suppressed} suppressed` : "") +
      (report.errors.length > 0 ? `, ${report.errors.length} file(s) not analyzed` : ""),
  );
  lines.push(`Sources verified on ${report.sourcesVerifiedAt}.`);
  lines.push(report.disclaimer);
  return `${lines.join("\n")}\n`;
}
