using Microsoft.Data.SqlClient;

namespace WebApi.Repositories;

public static class SqlServerErrors
{
    private const int DUPLICATE_INDEX = 2601;
    private const int DUPLICATE_CONSTRAINT = 2627;
    public const int FOREIGN_KEY_CONFLICT = 547;

    public static bool IsDuplicateProductCode(SqlException exception) =>
        (exception.Number is DUPLICATE_INDEX or DUPLICATE_CONSTRAINT) &&
        (exception.Message.Contains("UX_MasterProduct_ProductCode", StringComparison.OrdinalIgnoreCase) ||
         exception.Message.Contains("INDEX_MasterProduct_ProductCode", StringComparison.OrdinalIgnoreCase));
}
