using WebApi.Models.Exceptions;
using Dapper;
using Microsoft.Data.SqlClient;
using WebApi.Models.SaleOuts;

namespace WebApi.Repositories;

public class SaleOutRepository
{
    private readonly string _connectionString;

    public SaleOutRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chưa cấu hình DefaultConnection.");
    }

    internal async Task<(IEnumerable<SaleOutItemDto> Items, int TotalCount)> GetSaleOutsAsync(
        string? columnExpr, string? keyword, int page, int pageSize)
    {
        string whereClause = "";
        if (columnExpr is not null)
        {
            bool isDateField = columnExpr == "so.OrderDate";
            whereClause = isDateField
                ? $"WHERE {columnExpr} = TRY_CONVERT(int, @Keyword)"
                : $"WHERE {columnExpr} LIKE @SearchTerm";
        }

        // 3. Câu SQL kết hợp: đếm tổng số dòng và phân trang dữ liệu trong 1 lần truy vấn
        var sql = $"""
            SELECT COUNT(*)
            FROM dbo.SaleOut so
            INNER JOIN dbo.MasterProduct mp ON so.ProductId = mp.Id
            {whereClause};

            SELECT
                so.Id,
                so.SaleOutNo,
                so.CustomerPoNo,
                so.OrderDate,
                so.CustomerName,
                so.ProductId,
                mp.ProductCode,
                mp.ProductName,
                mp.Unit,
                so.Quantity,
                so.QuantityPerBox,
                so.BoxQuantity,
                so.Price,
                so.Amount
            FROM dbo.SaleOut so
            INNER JOIN dbo.MasterProduct mp ON so.ProductId = mp.Id
            {whereClause}
            ORDER BY so.OrderDate DESC, so.SaleOutNo DESC, so.Id
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

        // 4. Thực thi bằng Dapper (dùng QueryMultipleAsync để tối ưu hiệu năng)
        await using var connection = new SqlConnection(_connectionString);
        using var result = await connection.QueryMultipleAsync(sql, parameters);

        var totalCount = await result.ReadSingleAsync<int>();
        var items = await result.ReadAsync<SaleOutItemDto>();

        return (items, totalCount);
    }
    public async Task<string> CreateSaleOutAsync(SaleOutDocument document)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        await AcquireCreateLockAsync(connection, transaction);
        var products = await connection.QueryAsync<WebApi.Models.Products.ProductChoice>(
            "SELECT Id, ProductCode FROM dbo.MasterProduct WHERE Id IN @Ids",
            new { Ids = document.Items.Select(item => item.ProductId).Distinct() }, transaction);
        var productCodes = products.ToDictionary(product => product.Id, product => product.ProductCode);
        var saleOutNo = await SaveDocumentAsync(connection, transaction, document, productCodes);
        await transaction.CommitAsync();
        return saleOutNo;
    }

    private static async Task AcquireCreateLockAsync(SqlConnection connection, SqlTransaction transaction)
    {
        var lockResult = await connection.ExecuteScalarAsync<int>("""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = 'SaleOutCreate', @LockMode = 'Exclusive',
                @LockOwner = 'Transaction', @LockTimeout = 10000;
            SELECT @result;
            """, transaction: transaction);
        if (lockResult < 0)
            throw new BusinessConflictException("Không thể tạo phiếu lúc này, vui lòng thử lại.");
    }

    private static async Task<string> SaveDocumentAsync(SqlConnection connection, SqlTransaction transaction,
        SaleOutDocument document, IReadOnlyDictionary<Guid, string> productCodes)
    {
        await ValidateProductsAsync(connection, transaction, document, productCodes);
        var saleOutNo = await AllocateSaleOutNumberAsync(connection, transaction, document.NumberPrefix);
        await InsertLinesAsync(connection, transaction, document, saleOutNo);
        return saleOutNo;
    }

    private static async Task ValidateProductsAsync(SqlConnection connection, SqlTransaction transaction,
        SaleOutDocument document, IReadOnlyDictionary<Guid, string> productCodes)
    {
        foreach (var line in document.Items)
        {
            if (!productCodes.ContainsKey(line.ProductId))
                throw new RequestValidationException("Sản phẩm không tồn tại.");
        }
        var duplicates = (await connection.QueryAsync<Guid>("""
            SELECT DISTINCT ProductId FROM dbo.SaleOut
            WHERE CustomerPoNo = @CustomerPoNo AND ProductId IN @Ids;
            """, new { document.CustomerPoNo, Ids = document.Items.Select(item => item.ProductId).Distinct() }, transaction))
            .ToHashSet();
        var duplicate = document.Items.FirstOrDefault(item => duplicates.Contains(item.ProductId));
        if (duplicate is not null)
            throw new BusinessConflictException($"Số PO khách hàng: {document.CustomerPoNo}; Mã sản phẩm: {productCodes[duplicate.ProductId]} đã có trên hệ thống");
    }

    private static async Task<string> AllocateSaleOutNumberAsync(SqlConnection connection,
        SqlTransaction transaction, string prefix)
    {
        // Cấp số trong cùng transaction và khóa tạo phiếu để tránh hai yêu cầu lấy trùng số.
        var lastNumber = await connection.ExecuteScalarAsync<int>("""
            SELECT COALESCE(MAX(TRY_CONVERT(int, RIGHT(SaleOutNo, 4))), 0)
            FROM dbo.SaleOut WHERE SaleOutNo LIKE @Pattern AND LEN(SaleOutNo) = @NumberLength;
            """, new { Pattern = prefix + "[0-9][0-9][0-9][0-9]", NumberLength = prefix.Length + 4 }, transaction);
        return SaleOutRules.CreateNumber(prefix, lastNumber + 1);
    }

    private static Task InsertLinesAsync(SqlConnection connection, SqlTransaction transaction,
        SaleOutDocument document, string saleOutNo)
    {
        const string SQL = """
            INSERT INTO dbo.SaleOut
                (Id, SaleOutNo, CustomerPoNo, OrderDate, CustomerName, ProductId,
                 Quantity, Price, Amount, QuantityPerBox, BoxQuantity)
            VALUES
                (@Id, @SaleOutNo, @CustomerPoNo, @OrderDate, @CustomerName, @ProductId,
                 @Quantity, @Price, @Amount, @QuantityPerBox, @BoxQuantity);
            """;
        var rows = document.Items.Select(item => new
        {
            Id = Guid.NewGuid(),
            SaleOutNo = saleOutNo,
            document.CustomerPoNo,
            document.OrderDate,
            document.CustomerName,
            item.ProductId,
            item.Quantity,
            item.Price,
            item.Amount,
            item.QuantityPerBox,
            item.BoxQuantity
        });
        return connection.ExecuteAsync(SQL, rows, transaction);
    }

    public async Task<int> ImportSaleOutsAsync(IReadOnlyList<SaleOutDocument> documents)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        await AcquireCreateLockAsync(connection, transaction);
        var lines = documents.SelectMany(document => document.Items).ToList();
        var codes = lines.Select(line => line.ProductCode).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var products = (await connection.QueryAsync<WebApi.Models.Products.ProductChoice>(
            "SELECT Id, ProductCode FROM dbo.MasterProduct WHERE ProductCode IN @Codes",
            new { Codes = codes }, transaction)).ToList();
        var productIds = products.ToDictionary(product => product.ProductCode, product => product.Id, StringComparer.OrdinalIgnoreCase);
        var productCodes = products.ToDictionary(product => product.Id, product => product.ProductCode);
        foreach (var line in lines)
        {
            if (line.ProductCode is null || !productIds.ContainsKey(line.ProductCode))
                throw new RequestValidationException($"Dòng {line.RowNumber}: Mã sản phẩm {line.ProductCode} không tồn tại.");
        }
        foreach (var document in documents)
        {
            var resolved = document with
            {
                Items = document.Items.Select(line => line with { ProductId = productIds[line.ProductCode!] }).ToList()
            };
            await SaveDocumentAsync(connection, transaction, resolved, productCodes);
        }
        await transaction.CommitAsync();
        return lines.Count;
    }

    public async Task<bool> UpdateSaleOutAsync(Guid id, SaleOutWriteLine line)
    {
        const string SQL = """
            UPDATE dbo.SaleOut
            SET Quantity = @Quantity, QuantityPerBox = @QuantityPerBox, Price = @Price,
                BoxQuantity = @BoxQuantity, Amount = @Amount
            WHERE Id = @Id;
            """;
        await using var connection = new SqlConnection(_connectionString);
        var affected = await connection.ExecuteAsync(SQL, new
        {
            Id = id,
            line.Quantity,
            line.QuantityPerBox,
            line.Price,
            line.BoxQuantity,
            line.Amount
        });
        return affected > 0;
    }

    public async Task<bool> DeleteSaleOutAsync(Guid id)
    {
        await using var connection = new SqlConnection(_connectionString);
        return await connection.ExecuteAsync("DELETE FROM dbo.SaleOut WHERE Id = @Id", new { Id = id }) > 0;
    }

    public async Task<IEnumerable<SaleOutItemDto>> GetAllSaleOutsAsync()
    {
        const string SQL = """
            SELECT
                so.SaleOutNo,
                so.CustomerPoNo,
                so.OrderDate,
                so.CustomerName,
                mp.ProductCode,
                mp.ProductName,
                mp.Unit,
                so.Quantity,
                so.QuantityPerBox,
                so.BoxQuantity,
                so.Price,
                so.Amount
            FROM dbo.SaleOut so
            INNER JOIN dbo.MasterProduct mp ON so.ProductId = mp.Id
            ORDER BY so.OrderDate DESC, so.SaleOutNo DESC, so.Id;
            """;

        await using var connection = new SqlConnection(_connectionString);
        return await connection.QueryAsync<SaleOutItemDto>(SQL);
    }

    public async Task<IEnumerable<string>> GetSaleOutNumbersAsync()
    {
        const string SQL = """
            SELECT DISTINCT SaleOutNo
            FROM dbo.SaleOut
            WHERE SaleOutNo IS NOT NULL
                AND SaleOutNo <> ''
            ORDER BY SaleOutNo DESC;
            """;

        await using var connection = new SqlConnection(_connectionString);
        return await connection.QueryAsync<string>(SQL);
    }

    public async Task<IEnumerable<SaleOutItemDto>> GetBySaleOutNoAsync(string saleOutNo)
    {
        const string SQL = """
            SELECT
                so.Id,
                so.SaleOutNo,
                so.CustomerPoNo,
                so.OrderDate,
                so.CustomerName,
                so.ProductId,
                mp.ProductCode,
                mp.ProductName,
                mp.Unit,
                so.Quantity,
                so.QuantityPerBox,
                so.BoxQuantity,
                so.Price,
                so.Amount
            FROM dbo.SaleOut AS so
            INNER JOIN dbo.MasterProduct AS mp
                ON mp.Id = so.ProductId
            WHERE so.SaleOutNo = @SaleOutNo
            ORDER BY mp.ProductCode, so.Id;
            """;

        await using var connection = new SqlConnection(_connectionString);

        return await connection.QueryAsync<SaleOutItemDto>(SQL, new { SaleOutNo = saleOutNo });
    }

    public async Task<IEnumerable<SaleOutReportItemDto>> GetReportAsync(
        int startDate,
        int endDate)
    {
        const string SQL = """
            SELECT
                ProductId,
                ProductCode,
                ProductName,
                TotalQuantity,
                TotalAmount
            FROM dbo.fnSaleOutReport(@StartDate, @EndDate)
            ORDER BY ProductCode, ProductId;
            """;

        await using var connection = new SqlConnection(_connectionString);

        return await connection.QueryAsync<SaleOutReportItemDto>(
            SQL,
            new
            {
                StartDate = startDate,
                EndDate = endDate
            });
    }
}
