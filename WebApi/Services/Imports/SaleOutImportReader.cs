using System.Globalization;
using OfficeOpenXml;
using WebApi.Models.Exceptions;
using WebApi.Models.SaleOuts;

namespace WebApi.Services.Imports;

public static class SaleOutImportReader
{
    public static readonly string[] IMPORT_HEADERS =
        ["Số PO khách hàng", "Ngày đặt hàng", "Khách hàng", "Mã sản phẩm", "Số lượng", "Số lượng/thùng", "Đơn giá"];
    private static readonly string[] DATE_FORMATS = [SaleOutRules.DATE_FORMAT, "dd/MM/yyyy"];

    public static Task<List<ImportSaleOutRow>> ReadAsync(IFormFile? file) =>
        ExcelImport.ReadAsync(file, IMPORT_HEADERS, ReadRows);

    private static List<ImportSaleOutRow> ReadRows(ExcelWorksheet sheet)
    {
        var rows = new List<ImportSaleOutRow>();
        var keys = new HashSet<(string Po, string Code)>();
        for (var row = 2; row <= sheet.Dimension.End.Row; row++)
        {
            if (ExcelImport.IsEmptyRow(sheet, row, IMPORT_HEADERS.Length)) continue;
            var item = ReadRow(sheet, row);
            if (!keys.Add((item.CustomerPoNo.ToUpperInvariant(), item.ProductCode.ToUpperInvariant())))
                throw new ImportValidationException($"Dòng {row}: Số PO khách hàng: {item.CustomerPoNo}; Mã sản phẩm: {item.ProductCode} bị trùng trong file.");
            rows.Add(item);
        }
        return rows;
    }

    private static ImportSaleOutRow ReadRow(ExcelWorksheet sheet, int row)
    {
        var po = sheet.Cells[row, 1].Text.Trim();
        var customer = sheet.Cells[row, 3].Text.Trim();
        var code = sheet.Cells[row, 4].Text.Trim();
        if (code.Length == 0 || code.Length > 50)
            throw new ImportValidationException($"Dòng {row}: Mã sản phẩm bắt buộc và tối đa 50 ký tự.");
        var orderDate = ReadOrderDate(sheet.Cells[row, 2], row).ToString(SaleOutRules.DATE_FORMAT, CultureInfo.InvariantCulture);
        var line = new CreateSaleOutLine
        {
            ProductId = Guid.NewGuid(), // ID thật được đối chiếu theo mã sản phẩm trong transaction.
            Quantity = ExcelImport.ReadDecimal(sheet, row, 5, IMPORT_HEADERS[4]),
            QuantityPerBox = ExcelImport.ReadDecimal(sheet, row, 6, IMPORT_HEADERS[5]),
            Price = ExcelImport.ReadDecimal(sheet, row, 7, IMPORT_HEADERS[6])
        };
        ExcelImport.ValidateRow(new CreateSaleOutRequest
        {
            CustomerPoNo = po,
            CustomerName = customer,
            OrderDate = orderDate,
            Items = [line]
        }, row);
        return new(row, po, orderDate, customer, code, line.Quantity, line.QuantityPerBox, line.Price);
    }

    private static DateTime ReadOrderDate(ExcelRange cell, int row)
    {
        if (cell.Value is DateTime dateTime) return dateTime;
        if (cell.Value is double serial && serial >= 1 && serial <= 2958465)
            return DateTime.FromOADate(serial);
        if (DateTime.TryParseExact(cell.Text.Trim(), DATE_FORMATS, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var orderDate)) return orderDate;
        throw new ImportValidationException($"Dòng {row}: Ngày đặt hàng không hợp lệ (yyyy-MM-dd hoặc dd/MM/yyyy).");
    }
}
