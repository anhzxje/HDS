using OfficeOpenXml;
using OfficeOpenXml.Style;
using WebApi.Models.SaleOuts;

namespace WebApi.Services;

public class SaleOutReportService
{
    private const int HEADER_ROW = 5;
    private static readonly string[] HEADERS = ["STT", "Mã sản phẩm", "Tên sản phẩm", "Số lượng", "Thành tiền"];
    private static readonly double[] COLUMN_WIDTHS = [8, 20, 30, 18, 22];

    public byte[] CreateExcel(DateOnly startDate, DateOnly endDate, IReadOnlyList<SaleOutReportItemDto> items)
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("Doanh thu");
        WriteTitle(sheet, startDate, endDate);
        WriteHeaders(sheet);
        var totalRow = WriteRows(sheet, items);
        WriteTotals(sheet, totalRow, items);
        FormatTable(sheet, totalRow);
        return package.GetAsByteArray();
    }

    private static void WriteTitle(ExcelWorksheet sheet, DateOnly startDate, DateOnly endDate)
    {
        sheet.Cells["A1:E1"].Merge = true;
        sheet.Cells["A1"].Value = "BÁO CÁO DOANH THU SẢN PHẨM";
        sheet.Cells["A1"].Style.Font.Bold = true;
        sheet.Cells["A1"].Style.Font.Size = 16;
        sheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        sheet.Cells["A3:B3"].Merge = true;
        sheet.Cells["A3"].Value = $"Từ ngày: {startDate:dd/MM/yyyy}";
        sheet.Cells["C3:E3"].Merge = true;
        sheet.Cells["C3"].Value = $"Đến ngày: {endDate:dd/MM/yyyy}";
    }

    private static void WriteHeaders(ExcelWorksheet sheet)
    {
        for (var column = 0; column < HEADERS.Length; column++)
            sheet.Cells[HEADER_ROW, column + 1].Value = HEADERS[column];
        using var header = sheet.Cells[HEADER_ROW, 1, HEADER_ROW, HEADERS.Length];
        header.Style.Font.Bold = true;
        header.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        header.Style.Fill.PatternType = ExcelFillStyle.Solid;
        header.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
    }

    private static int WriteRows(ExcelWorksheet sheet, IReadOnlyList<SaleOutReportItemDto> items)
    {
        var row = HEADER_ROW + 1;
        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            sheet.Cells[row, 1].Value = index + 1;
            sheet.Cells[row, 2].Value = item.ProductCode;
            sheet.Cells[row, 3].Value = item.ProductName;
            sheet.Cells[row, 4].Value = item.TotalQuantity;
            sheet.Cells[row, 5].Value = item.TotalAmount;
            row++;
        }
        return row;
    }

    private static void WriteTotals(ExcelWorksheet sheet, int row, IReadOnlyList<SaleOutReportItemDto> items)
    {
        sheet.Cells[row, 1, row, 3].Merge = true;
        sheet.Cells[row, 1].Value = "Tổng:";
        sheet.Cells[row, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        sheet.Cells[row, 4].Value = items.Sum(item => item.TotalQuantity);
        sheet.Cells[row, 5].Value = items.Sum(item => item.TotalAmount);
        sheet.Cells[row, 1, row, HEADERS.Length].Style.Font.Bold = true;
    }

    private static void FormatTable(ExcelWorksheet sheet, int totalRow)
    {
        sheet.Cells[HEADER_ROW + 1, 4, totalRow, 5].Style.Numberformat.Format = "#,##0.###";
        using var table = sheet.Cells[HEADER_ROW, 1, totalRow, HEADERS.Length];
        table.Style.Border.Top.Style = ExcelBorderStyle.Thin;
        table.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
        table.Style.Border.Left.Style = ExcelBorderStyle.Thin;
        table.Style.Border.Right.Style = ExcelBorderStyle.Thin;
        for (var column = 0; column < COLUMN_WIDTHS.Length; column++)
            sheet.Column(column + 1).Width = COLUMN_WIDTHS[column];
    }
}
