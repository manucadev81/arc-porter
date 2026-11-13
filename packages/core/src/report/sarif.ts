import type { Finding, Report, Rule, Severity } from "../finding.js";
import { rules as allRules } from "../rules/index.js";

const LEVEL: Record<Severity, "error" | "warning" | "note"> = {
  high: "error",
  medium: "warning",
  low: "note",
};

const SECURITY_SEVERITY: Record<Severity, string> = { high: "8.0", medium: "5.0", low: "2.0" };

export interface SarifOptions {
  rules?: readonly Rule[];
}

function ruleDescriptor(rule: Rule) {
  return {
    id: rule.id,
    name: rule.name,
    shortDescription: { text: rule.title },
    fullDescription: { text: rule.description },
    help: { text: `${rule.suggestion}\n\nSource: ${rule.docUrl}` },
    helpUri: rule.docUrl,
    defaultConfiguration: { level: LEVEL[rule.severity] },
    properties: {
      tags: ["arc", "portability"],
      "security-severity": SECURITY_SEVERITY[rule.severity],
      precision: rule.confidence,
    },
  };
}

function result(finding: Finding, ruleIndex: Map<string, number>, suppressedReason?: string) {
  const index = ruleIndex.get(finding.ruleId);
  const base = {
    ruleId: finding.ruleId,
    ...(index === undefined ? {} : { ruleIndex: index }),
    level: LEVEL[finding.severity],
    message: { text: `${finding.message} ${finding.suggestion}` },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.file.replace(/\\/g, "/"), uriBaseId: "%SRCROOT%" },
          region: {
            startLine: finding.line,
            startColumn: finding.column,
            snippet: { text: finding.snippet },
          },
        },
      },
    ],
    properties: { confidence: finding.confidence, severity: finding.severity },
  };
  if (suppressedReason === undefined) return base;
  return { ...base, suppressions: [{ kind: "external", justification: suppressedReason }] };
}

export function toSarif(report: Report, options: SarifOptions = {}): Record<string, unknown> {
  const rules = options.rules ?? allRules;
  const ruleIndex = new Map(rules.map((rule, at) => [rule.id, at]));
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: report.tool.name,
            version: report.tool.version,
            informationUri: "https://github.com/manucadev81/arc-porter",
            rules: rules.map(ruleDescriptor),
            properties: { sourcesVerifiedAt: report.sourcesVerifiedAt, disclaimer: report.disclaimer },
          },
        },
        results: [
          ...report.findings.map((finding) => result(finding, ruleIndex)),
          ...report.suppressed.map((finding) => result(finding, ruleIndex, finding.reason)),
        ],
        invocations: [
          {
            executionSuccessful: report.errors.length === 0,
            toolExecutionNotifications: report.errors.map((error) => ({
              level: "error",
              message: { text: error.message },
              locations: [
                { physicalLocation: { artifactLocation: { uri: error.file, uriBaseId: "%SRCROOT%" } } },
              ],
            })),
          },
        ],
      },
    ],
  };
}

export function renderSarif(report: Report, options: SarifOptions = {}): string {
  return `${JSON.stringify(toSarif(report, options), null, 2)}\n`;
}
