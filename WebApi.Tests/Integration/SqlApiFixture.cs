using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using WebApi.Controllers;

namespace WebApi.Tests.Integration;

// Opt-in is explicit; normal unit-test runs report these cases as skipped.
public sealed class SqlFactAttribute : FactAttribute
{
    public SqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("HDS_TEST_SQL_CONNECTION")))
            Skip = "Requires isolated SQL Server: run scripts/test-backend-sql.sh";
    }
}

public sealed class SqlApiFixture : IAsyncLifetime
{
    public string ConnectionString { get; private set; } = "";
    public HttpClient Client { get; private set; } = null!;
    private SqlTestFactory? _factory;

    public async Task InitializeAsync()
    {
        var value = Environment.GetEnvironmentVariable("HDS_TEST_SQL_CONNECTION");
        if (string.IsNullOrWhiteSpace(value)) return;
        var connection = new SqlConnectionStringBuilder(value);
        if (!Regex.IsMatch(connection.InitialCatalog, "^HDS_Test_[a-f0-9]{32}$") ||
            !Regex.IsMatch(connection.DataSource, "^127\\.0\\.0\\.1,[0-9]+$"))
            throw new InvalidOperationException("Refusing SQL tests: require a unique HDS_Test_<32 lowercase hex> database on loopback.");
        ConnectionString = connection.ConnectionString;
        var database = connection.InitialCatalog;
        connection.InitialCatalog = "master";
        await using (var master = new SqlConnection(connection.ConnectionString))
        {
            await master.OpenAsync();
            using var create = new SqlCommand($"IF DB_ID(N'{database}') IS NOT NULL THROW 50000, 'Refusing to reuse an existing test database', 1; CREATE DATABASE [{database}];", master);
            await create.ExecuteNonQueryAsync();
        }
        await using (var sql = new SqlConnection(ConnectionString))
        {
            await sql.OpenAsync();
            foreach (var file in new[] { "schema.sql", "fnSaleOutReport.sql" })
            {
                var script = (await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Sql", file)))
                    .Replace("HDS_Intern", database, StringComparison.Ordinal);
                foreach (var batch in Regex.Split(script, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
                {
                    if (string.IsNullOrWhiteSpace(batch)) continue;
                    using var command = new SqlCommand(batch, sql);
                    await command.ExecuteNonQueryAsync();
                }
            }
        }
        _factory = new SqlTestFactory(ConnectionString);
        Client = _factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
    }

    public async Task DisposeAsync()
    {
        Client?.Dispose();
        if (_factory is not null) await _factory.DisposeAsync();
        // No DROP/DELETE: the script owns and stops the disposable tmpfs container.
        SqlConnection.ClearAllPools();
    }

    private sealed class SqlTestFactory(string connectionString) : WebApplicationFactory<ProductsController>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("ConnectionStrings:DefaultConnection", connectionString);
        }
    }
}
