using Microsoft.EntityFrameworkCore.Migrations;

public partial class SafeEfMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Nickname",
            table: "Users",
            type: "text",
            nullable: true);

        migrationBuilder.Sql("UPDATE Users SET Status = 'inactive' WHERE LastSeenAt < NOW()");
    }
}
