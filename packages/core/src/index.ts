export { analyzeFiles } from "./analyzeFiles.js";
export { classifyFile } from "./detection/fileClassifier.js";
export { generateMarkdownReport } from "./report/markdownReport.js";
export type { MarkdownReportOptions } from "./report/markdownReport.js";
export { calculateRiskScore } from "./riskScore.js";
export { parsePrismaSchema } from "./analyzers/prisma/parsePrismaSchema.js";
export type {
  AnalyzedFile,
  AnalyzeOptions,
  AnalyzeResult,
  AnalyzeSummary,
  Category,
  ClassifiedFile,
  Finding,
  ParsedPrismaField,
  ParsedPrismaModel,
  ParsedPrismaSchema,
  RiskLevel,
  Severity,
  SourceType,
  SqlDialect
} from "./types.js";
