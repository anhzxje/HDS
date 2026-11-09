using Dapper;
using Microsoft.Data.SqlClient;

namespace WebApi.Repositories;

public class DatabaseRepository
{
    private readonly string _connectionString;

    public DatabaseRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chưa cấu hình DefaultConnection.");
    }

    public async Task<int> CheckConnectionAsync()
    {
        await using var connection = new SqlConnection(_connectionString);
        return await connection.ExecuteScalarAsync<int>("SELECT 1");
    }
}
