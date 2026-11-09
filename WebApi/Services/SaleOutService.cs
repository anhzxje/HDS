using System.ComponentModel.DataAnnotations;
using System.Globalization;
using OfficeOpenXml;
using WebApi.Models.Exceptions;
using WebApi.Repositories;
using WebApi.Models.SaleOuts;

namespace WebApi.Services;

public class SaleOutService
{
    private readonly SaleOutRepository _saleOutRepository;

    public SaleOutService(SaleOutRepository saleOutRepository)
    {
        _saleOutRepository = saleOutRepository;
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

    private static readonly string[] ImportHeaders = ["Số PO khách hàng", "Ngày đặt hàng", "Khách hàng", "Mã sản phẩm", "Số lượng", "Số lượng/thùng", "Đơn giá"];

    public byte[] CreateTemplate()
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("Xuat hang");
        for (var i = 0; i < ImportHeaders.Length; i++) sheet.Cells[1, i + 1].Value = ImportHeaders[i];
        sheet.Cells[1, 1, 1, ImportHeaders.Length].Style.Font.Bold = true;
        sheet.Cells[1, 1, 1, ImportHeaders.Length].AutoFitColumns();
        sheet.Column(2).Style.Numberformat.Format = "yyyy-mm-dd";
        return package.GetAsByteArray();
    }

    public async Task<int> ImportSaleOutsAsync(IFormFile? file)
    {
        if (file == null || file.Length == 0) throw new ImportValidationException("Vui lòng chọn file Excel có dữ liệu.");
        if (!string.Equals(Path.GetExtension(file.FileName), ".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new ImportValidationException("Chỉ hỗ trợ file .xlsx.");
        if (file.Length > 5 * 1024 * 1024) throw new ImportValidationException("File không được vượt quá 5 MB.");
        var rows = new List<ImportSaleOutRow>();
        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;
            using var package = new ExcelPackage(stream);
            if (package.Workbook.Worksheets.Count == 0) throw new ImportValidationException("File không có sheet dữ liệu.");
            var sheet = package.Workbook.Worksheets[0];
            if (sheet.Dimension == null) throw new ImportValidationException("Sheet dữ liệu trống.");
            for (var c = 1; c <= ImportHeaders.Length; c++)
                if (!string.Equals(sheet.Cells[1, c].Text.Trim(), ImportHeaders[c - 1], StringComparison.OrdinalIgnoreCase))
                    throw new ImportValidationException($"Tiêu đề cột {c} phải là '{ImportHeaders[c - 1]}'.");
            for (var r = 2; r <= sheet.Dimension.End.Row; r++)
            {
                if (Enumerable.Range(1, ImportHeaders.Length).All(c => string.IsNullOrWhiteSpace(sheet.Cells[r, c].Text))) continue;
                var po = sheet.Cells[r, 1].Text.Trim();
                var customer = sheet.Cells[r, 3].Text.Trim();
                var code = sheet.Cells[r, 4].Text.Trim();
                if (po.Length == 0 || customer.Length == 0 || code.Length == 0 || po.Length > 50 || customer.Length > 200 || code.Length > 50)
                    throw new ImportValidationException($"Dòng {r}: PO, khách hàng và mã sản phẩm bắt buộc và không được vượt giới hạn độ dài.");
                var dateValue = sheet.Cells[r, 2].Value;
                DateTime date;
                if (dateValue is DateTime dateTime) date = dateTime;
                else if (dateValue is double serial && serial >= 1 && serial <= 2958465) date = DateTime.FromOADate(serial);
                else if (!DateTime.TryParseExact(sheet.Cells[r, 2].Text.Trim(), new[] { "yyyy-MM-dd", "dd/MM/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
                    throw new ImportValidationException($"Dòng {r}: Ngày đặt hàng không hợp lệ (yyyy-MM-dd hoặc dd/MM/yyyy).");
                decimal[] numbers = new decimal[3];
                for (var c = 5; c <= 7; c++)
                    if (!decimal.TryParse(Convert.ToString(sheet.Cells[r, c].Value, CultureInfo.InvariantCulture), NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out numbers[c - 5]))
                        throw new ImportValidationException($"Dòng {r}: {ImportHeaders[c - 1]} phải là số hợp lệ.");
                var line = new CreateSaleOutLine { ProductId = Guid.NewGuid(), Quantity = numbers[0], QuantityPerBox = numbers[1], Price = numbers[2] };
                var validation = new CreateSaleOutRequest { CustomerPoNo = po, CustomerName = customer, OrderDate = date.ToString("yyyy-MM-dd"), Items = [line] };
                var errors = new List<ValidationResult>();
                if (!Validator.TryValidateObject(validation, new ValidationContext(validation), errors, true))
                    throw new ImportValidationException($"Dòng {r}: {string.Join(" ", errors.Select(e => e.ErrorMessage))}");
                rows.Add(new(r, po, validation.OrderDate, customer, code, numbers[0], numbers[1], numbers[2]));
            }
        }
        catch (Exception ex) when (ex is InvalidDataException or IOException or ArgumentException or FormatException)
        {
            throw new ImportValidationException("Không đọc được file Excel. Hãy kiểm tra lại định dạng file.");
        }
        if (rows.Count == 0) throw new ImportValidationException("File không có dòng dữ liệu.");
        var duplicate = rows.GroupBy(x => (x.CustomerPoNo.ToUpperInvariant(), x.ProductCode.ToUpperInvariant())).FirstOrDefault(g => g.Count() > 1);
        if (duplicate != null)
        {
            var row = duplicate.Last();
            throw new ImportValidationException($"Dòng {row.RowNumber}: Số PO khách hàng: {row.CustomerPoNo}; Mã sản phẩm: {row.ProductCode} bị trùng trong file.");
        }
        var groups = rows.GroupBy(x => (Po: x.CustomerPoNo.ToUpperInvariant(), Date: x.OrderDate, Customer: x.CustomerName.ToUpperInvariant()))
            .Select(group => (IReadOnlyList<ImportSaleOutRow>)group.ToList()).ToList();
        return await _saleOutRepository.ImportSaleOutsAsync(groups);
    }


    public Task<string> CreateSaleOutAsync(CreateSaleOutRequest request) =>
        _saleOutRepository.CreateSaleOutAsync(request);
    public Task<bool> UpdateSaleOutAsync(Guid id, UpdateSaleOutRequest request) =>
        _saleOutRepository.UpdateSaleOutAsync(id, request);

    public Task<bool> DeleteSaleOutAsync(Guid id) => _saleOutRepository.DeleteSaleOutAsync(id);

    public Task<IEnumerable<SaleOutItemDto>> GetAllSaleOutsAsync() =>
    _saleOutRepository.GetAllSaleOutsAsync();
}
