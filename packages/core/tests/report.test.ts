import { describe, expect, it } from "vitest";
import { analyzeFiles, generateMarkdownReport } from "../src";

describe("Markdown report", () => {
  it("contains expected report sections", () => {
    const result = analyzeFiles(
      [
        {
          path: "file.sql",
          content: "UPDATE users SET disabled = true;"
        }
      ],
      { dialect: "postgres" }
    );

    const markdown = generateMarkdownReport(result);

    expect(markdown).toContain("## DB Change Review");
    expect(markdown).toContain("**Medium risk** · 40/100 · **1 database risk found**");
    expect(markdown).toContain("| Critical | High | Medium | Low |");
    expect(markdown).toContain("| 1 | 0 | 0 | 0 |");
    expect(markdown).toContain("| 1 | 0 | 0 | 0 |\n\n---\n\n**Critical**");
    expect(markdown).not.toContain("### Critical findings (1)");
    expect(markdown).toContain("**Critical** · `sql.update_without_where` · `file.sql:1`");
    expect(markdown).toContain("`sql.update_without_where`");
    expect(markdown).toContain("`file.sql:1`");
    expect(markdown).toContain("Recommendation: _Add a WHERE clause or split the operation into safe batches._");
    expect(markdown).toContain("<sub>DB Change Review by dbaops</sub>");
  });

  it("separates severity groups without splitting findings in the same group", () => {
    const result = analyzeFiles(
      [
        {
          path: "file.sql",
          content: [
            "UPDATE users SET disabled = true;",
            "DROP TABLE audit_log;",
            "CREATE INDEX idx_users_email ON users(email);"
          ].join("\n")
        }
      ],
      { dialect: "postgres" }
    );

    const markdown = generateMarkdownReport(result);

    expect(markdown).toContain("`sql.update_without_where`");
    expect(markdown).toContain("`sql.drop_table`");
    expect(markdown).toContain("`postgres.create_index_without_concurrently`");
    expect(markdown.indexOf("`sql.update_without_where`")).toBeLessThan(markdown.indexOf("`sql.drop_table`"));
    expect(markdown.indexOf("`sql.drop_table`")).toBeLessThan(markdown.indexOf("---\n\n**High**"));
    expect(markdown.indexOf("---\n\n**High**")).toBeLessThan(
      markdown.indexOf("`postgres.create_index_without_concurrently`")
    );
  });

  it("links findings to source locations when a source URL base is provided", () => {
    const result = analyzeFiles(
      [
        {
          path: "db/migrations/001 risky.sql",
          content: "UPDATE users SET disabled = true;"
        }
      ],
      { dialect: "postgres" }
    );

    const markdown = generateMarkdownReport(result, {
      sourceUrlBase: "https://github.com/owner/repo/blob/abc123"
    });

    expect(markdown).toContain(
      "[`db/migrations/001 risky.sql:1`](https://github.com/owner/repo/blob/abc123/db/migrations/001%20risky.sql#L1)"
    );
  });
});
