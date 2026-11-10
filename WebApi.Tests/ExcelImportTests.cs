using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using WebApi.Models.Exceptions;
using WebApi.Services.Imports;

[assembly: CollectionBehavior(DisableTestParallelization = true)]
namespace WebApi.Tests;

public class ExcelImportTests
{
    static ExcelImportTests() => ExcelPackage.License.SetNonCommercialPersonal("HDS tests");

    [Fact]
    public async Task Missing_file_is_rejected() =>
        await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(null));

    [Theory]
    [InlineData("products.csv")]
    [InlineData("products.xls")]
    public async Task Unsupported_extension_is_rejected(string name)
    {
        using var stream = new MemoryStream([1]);
        var file = new FormFile(stream, 0, 1, "file", name);
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(file));
        Assert.Contains(".xlsx", error.Message);
    }

    [Fact]
    public async Task Oversized_file_is_rejected_before_reading()
    {
        using var stream = new MemoryStream();
        var file = new FormFile(stream, 0, ExcelImport.MAX_FILE_SIZE + 1, "file", "large.xlsx");
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(file));
        Assert.Contains("5 MB", error.Message);
    }

    [Fact]
    public async Task Corrupt_workbook_is_rejected()
    {
        using var stream = new MemoryStream([1, 2, 3]);
        await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(File(stream)));
    }

    [Fact]
    public async Task Invalid_header_is_rejected()
    {
        using var stream = Workbook(["Sai tiêu đề"], ["SP01"]);
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(File(stream)));
        Assert.Contains("Tiêu đề cột 1", error.Message);
    }

    [Fact]
    public async Task Empty_template_is_rejected()
    {
        using var stream = Workbook(ProductImportReader.IMPORT_HEADERS);
        await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(File(stream)));
    }

    [Fact]
    public async Task Product_duplicates_ignore_case_and_whitespace()
    {
        using var stream = Workbook(ProductImportReader.IMPORT_HEADERS,
            ["SP01", "Sản phẩm", "Cái", "Hộp", 10, 1],
            [" sp01 ", "Sản phẩm", "Cái", "Hộp", 10, 1]);
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(File(stream)));
        Assert.Contains("Dòng 3", error.Message);
        Assert.Contains("trùng", error.Message);
    }

    [Theory]
    [InlineData("2026-11-10")]
    [InlineData("10/11/2026")]
    public async Task Sale_out_dates_are_normalized(string date)
    {
        using var stream = Workbook(SaleOutImportReader.IMPORT_HEADERS,
            ["PO01", date, "Khách hàng", "SP01", 1.005m, 1, 0.1m]);
        var rows = await SaleOutImportReader.ReadAsync(File(stream));
        Assert.Equal("2026-11-10", Assert.Single(rows).OrderDate);
    }

    [Fact]
    public async Task Excel_serial_date_is_supported()
    {
        using var stream = Workbook(SaleOutImportReader.IMPORT_HEADERS,
            ["PO01", new DateTime(2026, 11, 10).ToOADate(), "Khách hàng", "SP01", 1, 1, 1]);
        var rows = await SaleOutImportReader.ReadAsync(File(stream));
        Assert.Equal("2026-11-10", Assert.Single(rows).OrderDate);
    }

    [Fact]
    public async Task Sale_out_duplicate_po_and_product_are_rejected()
    {
        using var stream = Workbook(SaleOutImportReader.IMPORT_HEADERS,
            ["PO01", "2026-11-10", "Khách hàng", "SP01", 1, 1, 1],
            ["po01", "2026-11-10", "Khách hàng", "sp01", 1, 1, 1]);
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => SaleOutImportReader.ReadAsync(File(stream)));
        Assert.Contains("trùng", error.Message);
    }

    [Theory]
    [InlineData("bad-date", 1, 1)]
    [InlineData("2026-11-10", 0, 1)]
    [InlineData("2026-11-10", 1, 0)]
    public async Task Sale_out_invalid_dates_or_quantities_are_rejected(string date, int quantity, int perBox)
    {
        using var stream = Workbook(SaleOutImportReader.IMPORT_HEADERS,
            ["PO01", date, "Khách hàng", "SP01", quantity, perBox, 1]);
        await Assert.ThrowsAsync<ImportValidationException>(() => SaleOutImportReader.ReadAsync(File(stream)));
    }

    private static FormFile File(MemoryStream stream) => new(stream, 0, stream.Length, "file", "data.xlsx");

    private static MemoryStream Workbook(string[] headers, params object[][] rows)
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("Data");
        for (var col = 0; col < headers.Length; col++) sheet.Cells[1, col + 1].Value = headers[col];
        for (var row = 0; row < rows.Length; row++)
            for (var col = 0; col < rows[row].Length; col++) sheet.Cells[row + 2, col + 1].Value = rows[row][col];
        return new MemoryStream(package.GetAsByteArray());
    }
}
