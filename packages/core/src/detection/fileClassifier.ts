import type { ClassifiedFile } from "../types.js";

export function classifyFile(path: string, content: string): ClassifiedFile {
  const normalized = path.replaceAll("\\", "/").toLowerCase();

  if (normalized === "prisma/schema.prisma" || normalized.endsWith("/prisma/schema.prisma")) {
    return { isDatabaseRelated: true, sourceType: "prisma", reason: "Prisma schema" };
  }

  if (normalized.endsWith(".sql")) {
    return { isDatabaseRelated: true, sourceType: "sql", reason: "SQL file" };
  }

  if (
    normalized.includes("prisma/migrations/") ||
    normalized.includes("db/migrate/") ||
    normalized.includes("alembic/versions/") ||
    normalized.includes("migration") ||
    normalized.includes("migrations")
  ) {
    if (normalized.endsWith(".cs") && normalized.includes("/migrations/")) {
      return { isDatabaseRelated: true, sourceType: "efcore", reason: "EF Core migration" };
    }

    return { isDatabaseRelated: true, sourceType: normalized.endsWith(".sql") ? "sql" : undefined, reason: "Migration path" };
  }

  if (content.includes("migrationBuilder.")) {
    return { isDatabaseRelated: true, sourceType: "efcore", reason: "EF Core migrationBuilder usage" };
  }

  return { isDatabaseRelated: false };
}
