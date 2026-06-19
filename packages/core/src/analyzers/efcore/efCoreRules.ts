import { lineNumberForOffset } from "../../detection/lineMapper.js";
import { finding } from "../../rules/common.js";
import type { Finding } from "../../types.js";

interface EfOperation {
  name: string;
  args: string;
  offset: number;
}

function extractOperations(content: string): EfOperation[] {
  const operations: EfOperation[] = [];
  const pattern = /migrationBuilder\.(\w+)(?:<[^>]+>)?\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content))) {
    let index = pattern.lastIndex;
    let depth = 1;
    let quote: '"' | "'" | undefined;

    while (index < content.length && depth > 0) {
      const char = content[index];
      const previous = content[index - 1];

      if (!quote && (char === '"' || char === "'")) {
        quote = char;
      } else if (quote === char && previous !== "\\") {
        quote = undefined;
      } else if (!quote && char === "(") {
        depth += 1;
      } else if (!quote && char === ")") {
        depth -= 1;
      }

      index += 1;
    }

    operations.push({
      name: match[1],
      args: content.slice(pattern.lastIndex, index - 1),
      offset: match.index
    });

    pattern.lastIndex = index;
  }

  return operations;
}

function stringArg(args: string, name: string): string | undefined {
  return new RegExp(`${name}\\s*:\\s*"([^"]+)"`).exec(args)?.[1];
}

function sqlString(args: string): string | undefined {
  return /@"([^"]+)"|"([^"]+)"/s.exec(args)?.[1] ?? /@"([^"]+)"|"([^"]+)"/s.exec(args)?.[2];
}

function base(file: string, content: string, operation: EfOperation) {
  return {
    sourceType: "efcore" as const,
    file,
    line: lineNumberForOffset(content, operation.offset),
    statement: `migrationBuilder.${operation.name}(${operation.args.trim()})`
  };
}

export function analyzeEfCoreOperations(file: string, content: string): Finding[] {
  const findings: Finding[] = [];

  for (const operation of extractOperations(content)) {
    const common = base(file, content, operation);
    const table = stringArg(operation.args, "table");
    const name = stringArg(operation.args, "name");

    if (operation.name === "DropTable") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.drop_table",
        severity: "critical",
        category: "destructive",
        title: "EF Core DropTable detected",
        message: "DropTable removes a table and its data, and can break deployed application versions.",
        suggestion: "Use a staged deprecation plan and drop only after all references are removed.",
        objectName: name
      }));
    }

    if (operation.name === "DropColumn") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.drop_column",
        severity: "critical",
        category: "data_loss",
        title: "EF Core DropColumn detected",
        message: "DropColumn can permanently remove data and break older application versions.",
        suggestion: "Stop reading and writing the column before removing it in a later migration.",
        objectName: table ? `${table}.${name ?? "column"}` : name
      }));
    }

    if (operation.name === "RenameColumn") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.rename_column",
        severity: "high",
        category: "compatibility",
        title: "EF Core RenameColumn detected",
        message: "Renaming a column can break application versions that still use the old name.",
        suggestion: "Use a compatibility migration with both old and new columns during rollout.",
        objectName: table ? `${table}.${name ?? "column"}` : name
      }));
    }

    if (operation.name === "RenameTable") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.rename_table",
        severity: "high",
        category: "compatibility",
        title: "EF Core RenameTable detected",
        message: "Renaming a table can break deployed code, jobs, views, and permissions.",
        suggestion: "Use a compatibility plan or replacement object before renaming production tables.",
        objectName: name
      }));
    }

    if (operation.name === "AlterColumn") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.alter_column",
        severity: "high",
        category: "compatibility",
        title: "EF Core AlterColumn detected",
        message: "Altering a column can rewrite large tables or make existing values incompatible.",
        suggestion: "Use expand-and-backfill migrations for production column changes.",
        objectName: table ? `${table}.${name ?? "column"}` : name
      }));
    }

    if (operation.name === "AddColumn" && /\bnullable\s*:\s*false\b/i.test(operation.args)) {
      findings.push(finding({
        ...common,
        ruleId: "efcore.add_not_null_column",
        severity: "high",
        category: "locking",
        title: "EF Core non-null column added directly",
        message: "Adding a non-null column directly can lock or validate the table and fail on existing rows.",
        suggestion: "Plan this as a phased migration and account for lock time or validation cost on production tables.",
        objectName: table ? `${table}.${name ?? "column"}` : name
      }));
    }

    if (operation.name === "AddColumn" && /\bdefaultValue(?:Sql)?\s*:/i.test(operation.args)) {
      findings.push(finding({
        ...common,
        ruleId: "efcore.add_column_with_default",
        severity: "medium",
        category: "performance",
        title: "EF Core column added with default",
        message: "Adding a column with a default can be expensive on large tables.",
        suggestion: "Add the column first, backfill in batches, then add the default separately.",
        objectName: table ? `${table}.${name ?? "column"}` : name
      }));
    }

    if (operation.name === "CreateIndex") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.create_index",
        severity: "medium",
        category: "locking",
        title: "EF Core CreateIndex detected",
        message: "Creating an index can lock or slow writes depending on the database engine and table size.",
        suggestion: "For Postgres, use a concurrent index migration for production tables.",
        objectName: name
      }));
    }

    if (operation.name === "AddForeignKey") {
      findings.push(finding({
        ...common,
        ruleId: "efcore.add_foreign_key",
        severity: "high",
        category: "locking",
        title: "EF Core AddForeignKey detected",
        message: "Adding a foreign key can validate existing rows and lock large tables.",
        suggestion: "Use engine-specific online validation patterns where available.",
        objectName: name
      }));
    }

    if (operation.name === "Sql") {
      const sql = sqlString(operation.args)?.replace(/\s+/g, " ").trim() ?? operation.args;
      if (/^UPDATE\b/i.test(sql) && !/\bWHERE\b/i.test(sql)) {
        findings.push(finding({
          ...common,
          ruleId: "efcore.sql_update_without_where",
          severity: "critical",
          category: "data_loss",
          title: "EF Core raw UPDATE without WHERE",
          message: "Raw SQL UPDATE without WHERE may affect every row in the table.",
          suggestion: "Add a WHERE clause or split the operation into safe batches.",
          statement: sql
        }));
      }

      if (/^DELETE\s+FROM\b/i.test(sql) && !/\bWHERE\b/i.test(sql)) {
        findings.push(finding({
          ...common,
          ruleId: "efcore.sql_delete_without_where",
          severity: "critical",
          category: "data_loss",
          title: "EF Core raw DELETE without WHERE",
          message: "Raw SQL DELETE without WHERE may remove every row in the table.",
          suggestion: "Add a WHERE clause and consider deleting in batches.",
          statement: sql
        }));
      }

      if (/^DROP\s+TABLE\b/i.test(sql)) {
        findings.push(finding({
          ...common,
          ruleId: "efcore.sql_drop_table",
          severity: "critical",
          category: "destructive",
          title: "EF Core raw DROP TABLE",
          message: "Raw SQL DROP TABLE removes a table and its data.",
          suggestion: "Use a staged deprecation plan and verify backups before dropping tables.",
          statement: sql
        }));
      }

      if (/^ALTER\s+TABLE\b.*\bDROP\s+COLUMN\b/i.test(sql)) {
        findings.push(finding({
          ...common,
          ruleId: "efcore.sql_drop_column",
          severity: "critical",
          category: "data_loss",
          title: "EF Core raw DROP COLUMN",
          message: "Raw SQL DROP COLUMN can permanently remove data.",
          suggestion: "Stop reading and writing the column before removing it in a later migration.",
          statement: sql
        }));
      }
    }
  }

  return findings;
}
