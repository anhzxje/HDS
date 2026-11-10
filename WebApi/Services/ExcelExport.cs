using OfficeOpenXml;

namespace WebApi.Services;

public static class ExcelExport
{
    public static byte[] Create(string name, string[] headers, IEnumerable<object?[]> rows)
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add(name);
        for (var column = 0; column < headers.Length; column++)
            sheet.Cells[1, column + 1].Value = headers[column];
        var rowNumber = 2;
        foreach (var values in rows)
        {
            for (var column = 0; column < values.Length; column++)
                sheet.Cells[rowNumber, column + 1].Value = values[column];
            rowNumber++;
        }
        sheet.Cells[1, 1, 1, headers.Length].Style.Font.Bold = true;
        sheet.Cells[1, 1, rowNumber - 1, headers.Length].AutoFitColumns();
        return package.GetAsByteArray();
    }
}
