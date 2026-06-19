import type { AnalyzeOptions, Finding } from "../../types.js";
import { splitSqlStatements } from "./splitSqlStatements.js";
import { analyzeSqlStatement } from "./sqlRules.js";

export function analyzeSql(file: string, content: string, options: AnalyzeOptions): Finding[] {
  return splitSqlStatements(content).flatMap((statement) => analyzeSqlStatement(file, statement, options));
}
