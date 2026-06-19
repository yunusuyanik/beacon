import type { SqlStatement } from "../../types.js";

export function splitSqlStatements(sql: string): SqlStatement[] {
  const statements: SqlStatement[] = [];
  let current = "";
  let line = 1;
  let startLine = 1;
  let quote: "'" | '"' | "`" | undefined;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (!current.trim()) startLine = line;

    if (char === "\n") {
      line += 1;
      inLineComment = false;
    }

    if (inLineComment) {
      current += char;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (!quote && char === "-" && next === "-") {
      inLineComment = true;
      current += char;
      continue;
    }

    if (!quote && char === "/" && next === "*") {
      inBlockComment = true;
      current += char;
      continue;
    }

    if (!quote && (char === "'" || char === '"' || char === "`")) {
      quote = char;
    } else if (quote === char) {
      quote = undefined;
    }

    if (!quote && char === ";") {
      const text = current.trim();
      if (text) statements.push({ text, line: startLine });
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push({ text: tail, line: startLine });

  return statements;
}
