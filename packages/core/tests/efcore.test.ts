import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeFiles, parsePrismaSchema } from "../src";

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

describe("EF Core and Prisma analyzers", () => {
  it("detects risky EF Core migration operations", () => {
    const result = analyzeFiles(
      [{ path: "Data/Migrations/202606180001_RiskyEfMigration.cs", content: fixture("RiskyEfMigration.cs") }],
      { dialect: "postgres" }
    );

    expect(result.findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining([
        "efcore.add_not_null_column",
        "efcore.add_column_with_default",
        "efcore.drop_column",
        "efcore.sql_update_without_where"
      ])
    );
  });

  it("does not trigger critical findings for safer EF Core patterns", () => {
    const result = analyzeFiles(
      [{ path: "Data/Migrations/202606180002_SafeEfMigration.cs", content: fixture("SafeEfMigration.cs") }],
      { dialect: "postgres" }
    );

    expect(result.findings.filter((finding) => finding.severity === "critical")).toHaveLength(0);
  });

  it("parses Prisma schema context", () => {
    const schema = parsePrismaSchema(fixture("schema.prisma"));

    expect(schema.provider).toBe("postgresql");
    expect(schema.models.map((model) => model.name)).toEqual(["User", "Order"]);
    expect(schema.models.find((model) => model.name === "User")?.uniques).toContain("email @unique");
    expect(schema.models.find((model) => model.name === "Order")?.indexes).toContain("@@index([userId])");
  });
});
