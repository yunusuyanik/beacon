import { analyzeEfCore } from "./analyzers/efcore/analyzeEfCore.js";
import { parsePrismaSchema } from "./analyzers/prisma/parsePrismaSchema.js";
import { analyzeSql } from "./analyzers/sql/analyzeSql.js";
import { classifyFile } from "./detection/fileClassifier.js";
import { calculateRiskScore, getRiskLevel, shouldFailFor, summarizeFindings } from "./riskScore.js";
import type { AnalyzedFile, AnalyzeOptions, AnalyzeResult, Finding, ParsedPrismaSchema } from "./types.js";

export function analyzeFiles(files: AnalyzedFile[], options: AnalyzeOptions): AnalyzeResult {
  const findings: Finding[] = [];
  const prismaSchemas: ParsedPrismaSchema[] = [];

  for (const file of files) {
    const classification = classifyFile(file.path, file.content);
    if (!classification.isDatabaseRelated) continue;

    const language = file.language?.toLowerCase();
    const sourceType = classification.sourceType;

    if (sourceType === "sql" || language === "sql" || file.path.toLowerCase().endsWith(".sql")) {
      findings.push(...analyzeSql(file.path, file.content, options));
      continue;
    }

    if (sourceType === "efcore") {
      findings.push(...analyzeEfCore(file.path, file.content));
      continue;
    }

    if (sourceType === "prisma") {
      prismaSchemas.push(parsePrismaSchema(file.content));
    }
  }

  const riskScore = calculateRiskScore(findings);

  return {
    findings,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    shouldFail: shouldFailFor(findings, options.failOn),
    summary: summarizeFindings(findings),
    context: prismaSchemas.length > 0 ? { prismaSchemas } : undefined
  };
}
