import type { AnalyzeSummary, Finding, RiskLevel, Severity } from "./types.js";

const severityWeights: Record<Severity, number> = {
  critical: 40,
  high: 25,
  medium: 10,
  low: 3
};

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function calculateRiskScore(findings: Finding[]): number {
  return Math.min(
    100,
    findings.reduce((score, finding) => score + severityWeights[finding.severity], 0)
  );
}

export function getRiskLevel(score: number): RiskLevel {
  if (score === 0) return "none";
  if (score <= 24) return "low";
  if (score <= 59) return "medium";
  if (score <= 84) return "high";
  return "critical";
}

export function summarizeFindings(findings: Finding[]): AnalyzeSummary {
  return findings.reduce<AnalyzeSummary>(
    (summary, finding) => {
      summary[finding.severity] += 1;
      return summary;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}

export function shouldFailFor(findings: Finding[], failOn?: Severity): boolean {
  if (!failOn) return false;
  const threshold = severityRank[failOn];
  return findings.some((finding) => severityRank[finding.severity] >= threshold);
}
