import type { Finding, Severity } from "../types.js";

interface FindingInput {
  ruleId: string;
  sourceType: Finding["sourceType"];
  severity: Severity;
  category: Finding["category"];
  title: string;
  message: string;
  suggestion: string;
  file: string;
  line?: number;
  statement?: string;
  objectName?: string;
}

export function finding(input: FindingInput): Finding {
  return input;
}
