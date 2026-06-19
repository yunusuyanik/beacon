import type { Finding } from "../../types.js";
import { analyzeEfCoreOperations } from "./efCoreRules.js";

export function analyzeEfCore(file: string, content: string): Finding[] {
  return analyzeEfCoreOperations(file, content);
}
