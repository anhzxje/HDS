using System.ComponentModel.DataAnnotations;
using System.Globalization;
using OfficeOpenXml;
using WebApi.Models.Exceptions;

namespace WebApi.Services.Imports;

public static class ExcelImport
{
    public const int MAX_FILE_SIZE = 5 * 1024 * 1024;

    public static async Task<List<T>> ReadAsync<T>(
        IFormFile? file, string[] headers, Func<ExcelWorksheet, List<T>> readRows)
    {
        ValidateFile(file);
        try
        {
            using var stream = new MemoryStream();
            await file!.CopyToAsync(stream);
            stream.Position = 0;
            using var package = new ExcelPackage(stream);
            if (package.Workbook.Worksheets.Count == 0)
                throw new ImportValidationException("File Excel không có sheet dữ liệu.");
            var sheet = package.Workbook.Worksheets[0];
            ValidateHeaders(sheet, headers);
            var rows = readRows(sheet);
            if (rows.Count == 0)
                throw new ImportValidationException("File không có dòng dữ liệu để nhập.");
            return rows;
        }
        catch (Exception exception) when (exception is InvalidDataException or IOException or ArgumentException or FormatException)
        {
            throw new ImportValidationException("Không đọc được file Excel. Hãy kiểm tra lại định dạng file.", exception);
        }
    }

    private static void ValidateFile(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            throw new ImportValidationException("Vui lòng chọn file Excel có dữ liệu.");
        if (!string.Equals(Path.GetExtension(file.FileName), ".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new ImportValidationException("Chỉ hỗ trợ file Excel có định dạng .xlsx.");
        if (file.Length > MAX_FILE_SIZE)
            throw new ImportValidationException("Dung lượng file không được vượt quá 5 MB.");
    }

    private static void ValidateHeaders(ExcelWorksheet sheet, string[] headers)
    {
        if (sheet.Dimension is null)
            throw new ImportValidationException("Sheet Excel đang trống.");
        for (var column = 1; column <= headers.Length; column++)
        {
            if (!string.Equals(sheet.Cells[1, column].Text.Trim(), headers[column - 1], StringComparison.OrdinalIgnoreCase))
                throw new ImportValidationException($"Tiêu đề cột {column} không đúng. Cần là '{headers[column - 1]}'.");
        }
    }

    public static bool IsEmptyRow(ExcelWorksheet sheet, int row, int columnCount) =>
        Enumerable.Range(1, columnCount).All(column => string.IsNullOrWhiteSpace(sheet.Cells[row, column].Text));

    public static decimal ReadDecimal(ExcelWorksheet sheet, int row, int column, string label)
    {
        var text = Convert.ToString(sheet.Cells[row, column].Value, CultureInfo.InvariantCulture);
        if (!decimal.TryParse(text, NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
            CultureInfo.InvariantCulture, out var value))
            throw new ImportValidationException($"Dòng {row}: {label} phải là số hợp lệ.");
        return value;
    }

    public static void ValidateRow(object value, int row)
    {
        var errors = new List<ValidationResult>();
        if (!Validator.TryValidateObject(value, new ValidationContext(value), errors, true))
            throw new ImportValidationException($"Dòng {row}: {string.Join(" ", errors.Select(error => error.ErrorMessage))}");
    }

    public static byte[] CreateTemplate(string name, string[] headers, int? dateColumn = null)
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add(name);
        for (var column = 0; column < headers.Length; column++)
            sheet.Cells[1, column + 1].Value = headers[column];
        sheet.Cells[1, 1, 1, headers.Length].Style.Font.Bold = true;
        sheet.Cells[1, 1, 1, headers.Length].AutoFitColumns();
        if (dateColumn.HasValue)
            sheet.Column(dateColumn.Value).Style.Numberformat.Format = "yyyy-mm-dd";
        return package.GetAsByteArray();
    }
}
