import type { AnalyzeResult, Finding, Severity } from "../types.js";

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];
const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low"
};

export interface MarkdownReportOptions {
  sourceUrlBase?: string;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function summaryTable(result: AnalyzeResult): string {
  return [
    "| Critical | High | Medium | Low |",
    "| ---: | ---: | ---: | ---: |",
    `| ${result.summary.critical} | ${result.summary.high} | ${result.summary.medium} | ${result.summary.low} |`
  ].join("\n");
}

function sourceUrl(base: string, finding: Finding): string {
  const encodedPath = finding.file
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const line = finding.line ? `#L${finding.line}` : "";
  return `${base.replace(/\/$/, "")}/${encodedPath}${line}`;
}

function locationLabel(finding: Finding): string {
  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}

function locationMarkdown(finding: Finding, options: MarkdownReportOptions): string {
  const label = locationLabel(finding);
  if (!options.sourceUrlBase) return `\`${label}\``;

  return `[\`${label}\`](${sourceUrl(options.sourceUrlBase, finding)})`;
}

function findingBlock(finding: Finding, options: MarkdownReportOptions): string {
  return [
    `**${severityLabels[finding.severity]}** · \`${finding.ruleId}\` · ${locationMarkdown(finding, options)}`,
    "",
    finding.message,
    "",
    `Recommendation: _${finding.suggestion}_`
  ].join("\n");
}

function findingGroups(result: AnalyzeResult, options: MarkdownReportOptions): string[] {
  return severityOrder
    .map((severity) => result.findings.filter((finding) => finding.severity === severity))
    .filter((findings) => findings.length > 0)
    .map((findings) => findings.map((finding) => findingBlock(finding, options)).join("\n\n"));
}

export function generateMarkdownReport(result: AnalyzeResult, options: MarkdownReportOptions = {}): string {
  const riskWord = result.findings.length === 1 ? "risk" : "risks";
  const lines = [
    "## DB Change Review",
    "",
    `**${titleCase(result.riskLevel)} risk** · ${result.riskScore}/100 · **${result.findings.length} database ${riskWord} found**`
  ];

  if (result.findings.length > 0) {
    lines.push(
      "",
      summaryTable(result)
    );
  } else {
    lines.push("", "No database risks found.");
  }

  const groups = findingGroups(result, options);

  if (groups.length > 0) {
    lines.push(
      "",
      "---",
      "",
      groups.join("\n\n---\n\n")
    );
  }

  lines.push("", "<sub>DB Change Review by dbaops</sub>");

  return lines.join("\n");
}
