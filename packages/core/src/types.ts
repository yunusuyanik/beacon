export type SqlDialect = "postgres" | "sqlserver" | "mysql" | "unknown";

export type Severity = "critical" | "high" | "medium" | "low";

export type SourceType = "sql" | "efcore" | "prisma";

export type Category =
  | "destructive"
  | "locking"
  | "data_loss"
  | "performance"
  | "compatibility";

export interface AnalyzedFile {
  path: string;
  content: string;
  patch?: string;
  language?: string;
}

export interface AnalyzeOptions {
  dialect: SqlDialect;
  tableSizeHints?: Record<string, "small" | "medium" | "large">;
  failOn?: Severity;
}

export interface Finding {
  ruleId: string;
  sourceType: SourceType;
  severity: Severity;
  category: Category;
  title: string;
  message: string;
  suggestion: string;
  file: string;
  line?: number;
  statement?: string;
  objectName?: string;
}

export interface AnalyzeSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface AnalyzeResult {
  findings: Finding[];
  riskScore: number;
  riskLevel: RiskLevel;
  shouldFail: boolean;
  summary: AnalyzeSummary;
  context?: {
    prismaSchemas?: ParsedPrismaSchema[];
  };
}

export interface ClassifiedFile {
  isDatabaseRelated: boolean;
  sourceType?: SourceType;
  reason?: string;
}

export interface SqlStatement {
  text: string;
  line: number;
}

export interface ParsedPrismaField {
  name: string;
  type: string;
  attributes: string[];
}

export interface ParsedPrismaModel {
  name: string;
  fields: ParsedPrismaField[];
  indexes: string[];
  uniques: string[];
}

export interface ParsedPrismaSchema {
  provider?: string;
  models: ParsedPrismaModel[];
}
