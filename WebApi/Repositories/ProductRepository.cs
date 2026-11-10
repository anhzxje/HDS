using Dapper;
using Microsoft.Data.SqlClient;
using WebApi.Models.Products;
using WebApi.Models.Exceptions;

namespace WebApi.Repositories;

public class ProductRepository
{
    private readonly string _connectionString;

    public ProductRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chưa cấu hình DefaultConnection.");
    }

    // columnName đã được ProductService đối chiếu với danh sách trường cho phép.
    internal async Task<(IEnumerable<ProductItemDto> Items, int TotalCount)> GetProductsAsync(
        string? columnName, string? keyword, int page, int pageSize)
    {
        string whereClause = "";

        if (columnName is not null)
        {
            bool isNumericField = columnName is "QuantityPerBox" or "ProductWeight";
            whereClause = isNumericField
                ? $"WHERE [{columnName}] = TRY_CONVERT(decimal(18, 3), @Keyword)"
                : $"WHERE [{columnName}] LIKE @SearchTerm";
        }

        var sql = $"""
            SELECT COUNT(*)
            FROM dbo.MasterProduct
            {whereClause};

            SELECT Id, ProductCode, ProductName, Unit, Specification, QuantityPerBox, ProductWeight
            FROM dbo.MasterProduct
            {whereClause}
            ORDER BY ProductCode, Id
            OFFSET @Offset ROWS
            FETCH NEXT @PageSize ROWS ONLY;
            """;

        var parameters = new
        {
            SearchTerm = $"%{keyword?.Trim()}%",
            Keyword = keyword?.Trim(),
            Offset = (page - 1) * pageSize,
            PageSize = pageSize
        };

        await using var connection = new SqlConnection(_connectionString);
        using var result = await connection.QueryMultipleAsync(sql, parameters);

        var totalCount = await result.ReadSingleAsync<int>();
        var products = await result.ReadAsync<ProductItemDto>();
        return (products, totalCount);
    }
    public async Task<bool> UpdateProductAsync(Guid id, UpdateProductRequest request)
    {
        const string SQL = """
            UPDATE dbo.MasterProduct
            SET Unit = @Unit,
                Specification = @Specification,
                QuantityPerBox = @QuantityPerBox,
                ProductWeight = @ProductWeight
            WHERE Id = @Id;
            """;

        await using var connection = new SqlConnection(_connectionString);

        var affectedRows = await connection.ExecuteAsync(SQL, new
        {
            Id = id,
            Unit = request.Unit?.Trim(),
            Specification = request.Specification?.Trim(),
            request.QuantityPerBox,
            request.ProductWeight
        });

        return affectedRows > 0;
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        const string SQL = """
            DELETE FROM dbo.MasterProduct
            WHERE Id = @Id;
            """;

        await using var connection = new SqlConnection(_connectionString);

        try
        {
            return await connection.ExecuteAsync(SQL, new { Id = id }) > 0;
        }
        catch (SqlException ex) when (ex.Number == SqlServerErrors.FOREIGN_KEY_CONFLICT)
        {
            throw new BusinessConflictException("Không thể xoá sản phẩm vì đang có dữ liệu liên quan.", ex);
        }
    }

    public async Task<Guid> CreateProductAsync(CreateProductRequest request)
    {
        const string SQL = """
            INSERT INTO dbo.MasterProduct
                (Id, ProductCode, ProductName, Unit, Specification, QuantityPerBox, ProductWeight)
            VALUES
                (@Id, @ProductCode, @ProductName, @Unit, @Specification, @QuantityPerBox, @ProductWeight);
            """;

        await using var connection = new SqlConnection(_connectionString);

        var newId = Guid.NewGuid();

        try
        {
            await connection.ExecuteAsync(SQL, new
            {
                Id = newId,
                ProductCode = request.ProductCode?.Trim(),
                ProductName = request.ProductName?.Trim(),
                Unit = request.Unit?.Trim(),
                Specification = request.Specification?.Trim(),
                request.QuantityPerBox,
                request.ProductWeight
            });
        }
        catch (SqlException ex) when (SqlServerErrors.IsDuplicateProductCode(ex))
        {
            throw new BusinessConflictException($"Mã sản phẩm {request.ProductCode?.Trim()} đã tồn tại.", ex);
        }

        return newId;
    }

    public async Task<IEnumerable<ProductChoice>> GetProductChoicesAsync()
    {
        const string SQL = """
            SELECT Id, ProductCode, ProductName, Unit, QuantityPerBox
            FROM dbo.MasterProduct
            ORDER BY ProductCode, Id;
            """;

        await using var connection = new SqlConnection(_connectionString);
        return await connection.QueryAsync<ProductChoice>(SQL);
    }

    public async Task<IEnumerable<ProductItemDto>> GetAllProductsAsync()
    {
        const string SQL = """
            SELECT
                Id,
                ProductCode,
                ProductName,
                Unit,
                Specification,
                QuantityPerBox,
                ProductWeight
            FROM dbo.MasterProduct
            ORDER BY ProductCode, Id;
            """;

        await using var connection = new SqlConnection(_connectionString);

        return await connection.QueryAsync<ProductItemDto>(SQL);
    }

    public async Task ImportProductsAsync(
        IReadOnlyList<ImportProductRow> products)
    {
        const string SQL = """
            INSERT INTO dbo.MasterProduct
                (Id, ProductCode, ProductName, Unit, Specification,
                QuantityPerBox, ProductWeight)
            VALUES
                (@Id, @ProductCode, @ProductName, @Unit, @Specification,
                @QuantityPerBox, @ProductWeight);
            """;

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var transaction = await connection.BeginTransactionAsync();

        foreach (var item in products)
        {
            var product = item.Product;

            try
            {
                await connection.ExecuteAsync(
                    SQL,
                    new
                    {
                        Id = Guid.NewGuid(),
                        ProductCode = product.ProductCode!.Trim(),
                        ProductName = product.ProductName!.Trim(),
                        Unit = product.Unit!.Trim(),
                        Specification = product.Specification!.Trim(),
                        product.QuantityPerBox,
                        product.ProductWeight
                    },
                    transaction);
            }
            catch (SqlException ex) when (SqlServerErrors.IsDuplicateProductCode(ex))
            {
                throw new DuplicateProductCodeException(
                    item.RowNumber,
                    product.ProductCode!.Trim(), ex);
            }
        }

        await transaction.CommitAsync();
    }
}
