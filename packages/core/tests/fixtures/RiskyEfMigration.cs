using Microsoft.EntityFrameworkCore.Migrations;

public partial class RiskyEfMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Status",
            table: "Users",
            type: "text",
            nullable: false,
            defaultValue: "active");

        migrationBuilder.DropColumn(
            name: "LegacyCode",
            table: "Users");

        migrationBuilder.Sql("UPDATE Users SET Status = 'inactive'");
    }
}
