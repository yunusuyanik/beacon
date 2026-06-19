import type { ParsedPrismaField, ParsedPrismaModel, ParsedPrismaSchema } from "../../types.js";

export function parsePrismaSchema(content: string): ParsedPrismaSchema {
  const provider = /datasource\s+\w+\s*{[^}]*provider\s*=\s*"([^"]+)"/s.exec(content)?.[1];
  const models: ParsedPrismaModel[] = [];
  const modelPattern = /model\s+(\w+)\s*{([^}]*)}/g;
  let modelMatch: RegExpExecArray | null;

  while ((modelMatch = modelPattern.exec(content))) {
    const body = modelMatch[2];
    const fields: ParsedPrismaField[] = [];
    const indexes: string[] = [];
    const uniques: string[] = [];

    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//")) continue;

      if (line.startsWith("@@index")) {
        indexes.push(line);
        continue;
      }

      if (line.startsWith("@@unique")) {
        uniques.push(line);
        continue;
      }

      const [name, type, ...attributes] = line.split(/\s+/);
      if (!name || !type || name.startsWith("@")) continue;

      fields.push({
        name,
        type,
        attributes,
      });

      if (attributes.some((attribute) => attribute.startsWith("@unique"))) {
        uniques.push(`${name} @unique`);
      }
    }

    models.push({
      name: modelMatch[1],
      fields,
      indexes,
      uniques
    });
  }

  return { provider, models };
}
