using OfficeOpenXml;

namespace WebApi.Tests;

internal static class TestWorkbooks
{
    public static byte[] Create(string[] headers, params object?[][] rows)
    {
        ExcelPackage.License.SetNonCommercialPersonal("HDS tests");
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("Data");
        for (var col = 0; col < headers.Length; col++) sheet.Cells[1, col + 1].Value = headers[col];
        for (var row = 0; row < rows.Length; row++)
            for (var col = 0; col < rows[row].Length; col++) sheet.Cells[row + 2, col + 1].Value = rows[row][col];
        return package.GetAsByteArray();
    }
}
