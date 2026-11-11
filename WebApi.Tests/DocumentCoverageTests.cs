using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using WebApi.Models.Exceptions;
using WebApi.Models.SaleOuts;
using WebApi.Services;
using WebApi.Services.Imports;

namespace WebApi.Tests;

public class DocumentCoverageTests
{
    public DocumentCoverageTests() => ExcelPackage.License.SetNonCommercialPersonal("HDS tests");

    [Fact]
    public void Revenue_report_contains_values_and_totals_including_zero_price()
    {
        var bytes = new SaleOutReportService().CreateExcel(new(2026, 11, 1), new(2026, 11, 30),
        [new() { ProductCode = "A", ProductName = "Sản phẩm A", TotalQuantity = 1.005m, TotalAmount = 0.101m },
         new() { ProductCode = "B", ProductName = "Sản phẩm B", TotalQuantity = 2m, TotalAmount = 0m }]);
        using var package = new ExcelPackage(new MemoryStream(bytes)); var sheet = package.Workbook.Worksheets[0];
        Assert.Contains("01/11/2026", sheet.Cells["A3"].Text);
        Assert.Equal("Mã sản phẩm", sheet.Cells["B5"].Text);
        Assert.Equal("A", sheet.Cells["B6"].Text);
        Assert.Equal(1.005m, sheet.Cells["D6"].GetValue<decimal>());
        Assert.Equal("Tổng:", sheet.Cells["A8"].Text);
        Assert.Equal(3.005m, sheet.Cells["D8"].GetValue<decimal>());
        Assert.Equal(0.101m, sheet.Cells["E8"].GetValue<decimal>());
    }

    [Fact]
    public void Empty_revenue_report_has_zero_totals_and_export_preserves_text_values()
    {
        using var report = new ExcelPackage(new MemoryStream(new SaleOutReportService().CreateExcel(new(2026, 1, 1), new(2026, 1, 31), [])));
        Assert.Equal("Tổng:", report.Workbook.Worksheets[0].Cells["A6"].Text);
        Assert.Equal(0m, report.Workbook.Worksheets[0].Cells["E6"].GetValue<decimal>());
        using var export = new ExcelPackage(new MemoryStream(ExcelExport.Create("Data", ["Code", "Value"], [["001", 1.005m], ["=1+1", null]])));
        var sheet = export.Workbook.Worksheets[0];
        Assert.Equal("001", sheet.Cells["A2"].Text);
        Assert.Equal(1.005m, sheet.Cells["B2"].GetValue<decimal>());
        Assert.Equal("=1+1", sheet.Cells["A3"].Value);
        Assert.Empty(sheet.Cells["A3"].Formula);
    }

    [Fact]
    public void Pdf_rejects_empty_document() => Assert.Throws<ArgumentException>(() => new SaleOutPdfService().CreatePdf([]));

    [Fact]
    public void Pdf_handles_legacy_nullable_display_fields_and_unknown_date()
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        var bytes = new SaleOutPdfService().CreatePdf([new() { SaleOutNo = "STO2026110001", OrderDate = 0, Quantity = 1m }]);
        Assert.StartsWith("%PDF-", System.Text.Encoding.ASCII.GetString(bytes[..5]));
        Assert.True(bytes.Length > 1000);
    }

    [Fact]
    public async Task Empty_file_and_blank_sheet_are_rejected()
    {
        using var empty = new MemoryStream();
        await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(new FormFile(empty, 0, 0, "file", "empty.xlsx")));
        using var sheet = new MemoryStream(TestWorkbooks.Create([]));
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(new FormFile(sheet, 0, sheet.Length, "file", "blank.xlsx")));
        Assert.Contains("trống", error.Message);
    }

    [Fact]
    public async Task Product_reader_skips_blank_rows_trims_fields_and_accepts_uppercase_extension()
    {
        using var stream = new MemoryStream(TestWorkbooks.Create(ProductImportReader.IMPORT_HEADERS,
            [" SP01 ", " Sản phẩm ", " Cái ", " Hộp ", 0m, 0m], [],
            ["SP02", "Sản phẩm 2", "Cái", "Hộp", 1.005m, 2m]));
        var rows = await ProductImportReader.ReadAsync(new FormFile(stream, 0, stream.Length, "file", "DATA.XLSX"));
        Assert.Equal(2, rows.Count); Assert.Equal("SP01", rows[0].Product.ProductCode);
        Assert.Equal(4, rows[1].RowNumber); Assert.Equal(1.005m, rows[1].Product.QuantityPerBox);
    }

    [Theory]
    [InlineData("1,000")]
    [InlineData("1e3")]
    [InlineData("bad")]
    [InlineData("")]
    public async Task Decimal_text_rejects_grouping_exponent_and_invalid_values(string number)
    {
        using var stream = new MemoryStream(TestWorkbooks.Create(ProductImportReader.IMPORT_HEADERS, ["SP01", "Name", "Unit", "Box", number, 1m]));
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(new FormFile(stream, 0, stream.Length, "file", "data.xlsx")));
        Assert.Contains("Dòng 2", error.Message); Assert.Contains("số hợp lệ", error.Message);
    }

    [Fact]
    public async Task Product_import_applies_dto_validation()
    {
        using var stream = new MemoryStream(TestWorkbooks.Create(ProductImportReader.IMPORT_HEADERS, ["SP01", "Name", "Unit", "Box", -1m, 1m]));
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => ProductImportReader.ReadAsync(new FormFile(stream, 0, stream.Length, "file", "data.xlsx")));
        Assert.Contains("Dòng 2", error.Message); Assert.Contains("không âm", error.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("TOO_LONG")]
    public async Task Sale_out_import_requires_product_code_within_limit(string code)
    {
        if (code == "TOO_LONG") code = new string('x', 51);
        using var stream = new MemoryStream(TestWorkbooks.Create(SaleOutImportReader.IMPORT_HEADERS, ["PO", "2026-11-10", "Customer", code, 1m, 1m, 0m]));
        var error = await Assert.ThrowsAsync<ImportValidationException>(() => SaleOutImportReader.ReadAsync(new FormFile(stream, 0, stream.Length, "file", "data.xlsx")));
        Assert.Contains("50", error.Message);
    }

    [Fact]
    public async Task Sale_out_import_supports_typed_excel_date_and_skips_blank_rows()
    {
        using var stream = new MemoryStream(TestWorkbooks.Create(SaleOutImportReader.IMPORT_HEADERS, [], [" PO ", new DateTime(2024, 2, 29), " Customer ", " SP ", 1m, 1m, 0m]));
        var row = Assert.Single(await SaleOutImportReader.ReadAsync(new FormFile(stream, 0, stream.Length, "file", "data.xlsx")));
        Assert.Equal("2024-02-29", row.OrderDate); Assert.Equal("PO", row.CustomerPoNo); Assert.Equal(3, row.RowNumber);
    }
}
