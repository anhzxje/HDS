using WebApi.Services.Imports;
using WebApi.Repositories;
using WebApi.Models.SaleOuts;

namespace WebApi.Services;

public class SaleOutService
{
    private readonly SaleOutRepository _saleOutRepository;
    private readonly SaleOutPdfService _saleOutPdfService;
    private readonly SaleOutReportService _saleOutReportService;

    public SaleOutService(SaleOutRepository saleOutRepository, SaleOutPdfService saleOutPdfService, SaleOutReportService saleOutReportService)
    {
        _saleOutRepository = saleOutRepository;
        _saleOutPdfService = saleOutPdfService;
        _saleOutReportService = saleOutReportService;
    }

    /// <summary>
    /// Lấy danh sách xuất hàng kèm tìm kiếm và phân trang trực tiếp từ SQL Server.
    /// </summary>
    public async Task<(IEnumerable<SaleOutItemDto> Items, int TotalCount)> GetSaleOutsAsync(
        string? field,
        string? keyword,
        int page,
        int pageSize)
    {
        // 1. Chỉ cho phép các trường tìm kiếm hợp lệ để bảo mật và chống SQL Injection
        var allowedFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "CustomerPoNo", "so.CustomerPoNo" },
            { "OrderDate", "so.OrderDate" },
            { "CustomerName", "so.CustomerName" },
            { "ProductCode", "mp.ProductCode" },
            { "ProductName", "mp.ProductName" }
        };

        string? columnExpr = null;
        if (!string.IsNullOrWhiteSpace(keyword) &&
            (string.IsNullOrWhiteSpace(field) || !allowedFields.TryGetValue(field, out columnExpr)))
        {
            throw new ArgumentException("Trường tìm kiếm không hợp lệ.", nameof(field));
        }

        return await _saleOutRepository.GetSaleOutsAsync(columnExpr, keyword, page, pageSize);
    }

    private static readonly string[] EXPORT_HEADERS =
    [
        "Mã số phiếu", "Số PO khách hàng", "Ngày đặt hàng", "Khách hàng",
        "Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Số lượng",
        "Số lượng/thùng", "Số thùng", "Đơn giá", "Thành tiền"
    ];

    public async Task<byte[]> ExportSaleOutsAsync()
    {
        var items = await _saleOutRepository.GetAllSaleOutsAsync();
        return ExcelExport.Create("Xuat hang", EXPORT_HEADERS,
            items.Select(item => new object?[]
            {
                item.SaleOutNo, item.CustomerPoNo, item.OrderDate, item.CustomerName,
                item.ProductCode, item.ProductName, item.Unit, item.Quantity,
                item.QuantityPerBox, item.BoxQuantity, item.Price, item.Amount
            }));
    }

    public byte[] CreateTemplate() =>
        ExcelImport.CreateTemplate("Xuat hang", SaleOutImportReader.IMPORT_HEADERS, dateColumn: 2);

    public async Task<int> ImportSaleOutsAsync(IFormFile? file)
    {
        var rows = await SaleOutImportReader.ReadAsync(file);
        var documents = rows.GroupBy(row => (
                Po: row.CustomerPoNo.ToUpperInvariant(), row.OrderDate,
                Customer: row.CustomerName.ToUpperInvariant()))
            .Select(PrepareImportDocument).ToList();
        return await _saleOutRepository.ImportSaleOutsAsync(documents);
    }

    private static SaleOutDocument PrepareImportDocument(IEnumerable<ImportSaleOutRow> rows)
    {
        var items = rows.ToList();
        var first = items[0];
        var lines = items.Select(row => SaleOutRules.PrepareLine(Guid.Empty,
            row.Quantity, row.QuantityPerBox, row.Price, row.ProductCode, row.RowNumber)).ToList();
        return PrepareDocument(first.CustomerPoNo, first.CustomerName, first.OrderDate, lines);
    }

    private static SaleOutDocument PrepareDocument(string customerPoNo, string customerName,
        string orderDateText, IReadOnlyList<SaleOutWriteLine> lines)
    {
        var orderDate = SaleOutRules.ParseOrderDate(orderDateText);
        return new(customerPoNo.Trim(), customerName.Trim(), ToDateNumber(orderDate),
            "STO" + orderDate.ToString("yyyyMM", System.Globalization.CultureInfo.InvariantCulture), lines);
    }

    public Task<string> CreateSaleOutAsync(CreateSaleOutRequest request)
    {
        var lines = request.Items.Select(item => SaleOutRules.PrepareLine(
            item.ProductId, item.Quantity, item.QuantityPerBox, item.Price)).ToList();
        var document = PrepareDocument(request.CustomerPoNo, request.CustomerName, request.OrderDate, lines);
        return _saleOutRepository.CreateSaleOutAsync(document);
    }

    public Task<bool> UpdateSaleOutAsync(Guid id, UpdateSaleOutRequest request)
    {
        var line = SaleOutRules.PrepareLine(Guid.Empty, request.Quantity, request.QuantityPerBox, request.Price);
        return _saleOutRepository.UpdateSaleOutAsync(id, line);
    }

    public Task<bool> DeleteSaleOutAsync(Guid id) => _saleOutRepository.DeleteSaleOutAsync(id);

    public Task<IEnumerable<SaleOutItemDto>> GetAllSaleOutsAsync() =>
        _saleOutRepository.GetAllSaleOutsAsync();

    public Task<IEnumerable<string>> GetSaleOutNumbersAsync() => _saleOutRepository.GetSaleOutNumbersAsync();

    public async Task<byte[]?> CreatePdfAsync(string saleOutNo)
    {
        var items = (await _saleOutRepository
            .GetBySaleOutNoAsync(saleOutNo))
            .ToList();

        if (items.Count == 0)
        {
            return null;
        }

        return _saleOutPdfService.CreatePdf(items);
    }

    public async Task<byte[]> CreateRevenueReportAsync(
        DateOnly startDate,
        DateOnly endDate)
    {
        if (startDate > endDate)
        {
            throw new ArgumentException(
                "Từ ngày không được lớn hơn đến ngày.");
        }

        var start = ToDateNumber(startDate);
        var end = ToDateNumber(endDate);

        var items = (await _saleOutRepository.GetReportAsync(start, end))
            .ToList();

        return _saleOutReportService.CreateExcel(
            startDate,
            endDate,
            items);
    }

    private static int ToDateNumber(DateOnly date)
    {
        return date.Year * 10000
            + date.Month * 100
            + date.Day;
    }
}
