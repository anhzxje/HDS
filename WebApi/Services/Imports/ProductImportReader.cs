using OfficeOpenXml;
using WebApi.Models.Exceptions;
using WebApi.Models.Products;

namespace WebApi.Services.Imports;

public static class ProductImportReader
{
    public static readonly string[] IMPORT_HEADERS =
        ["Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Quy cách", "Số lượng/thùng", "Trọng lượng"];

    public static Task<List<ImportProductRow>> ReadAsync(IFormFile? file) =>
        ExcelImport.ReadAsync(file, IMPORT_HEADERS, ReadRows);

    private static List<ImportProductRow> ReadRows(ExcelWorksheet sheet)
    {
        var products = new List<ImportProductRow>();
        var codes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (var row = 2; row <= sheet.Dimension.End.Row; row++)
        {
            if (ExcelImport.IsEmptyRow(sheet, row, IMPORT_HEADERS.Length)) continue;
            var product = ReadProduct(sheet, row);
            if (!codes.Add(product.ProductCode!))
                throw new ImportValidationException($"Dòng {row}: Mã sản phẩm '{product.ProductCode}' bị trùng trong file.");
            products.Add(new ImportProductRow(row, product));
        }
        return products;
    }

    private static CreateProductRequest ReadProduct(ExcelWorksheet sheet, int row)
    {
        var product = new CreateProductRequest
        {
            ProductCode = sheet.Cells[row, 1].Text.Trim(),
            ProductName = sheet.Cells[row, 2].Text.Trim(),
            Unit = sheet.Cells[row, 3].Text.Trim(),
            Specification = sheet.Cells[row, 4].Text.Trim(),
            QuantityPerBox = ExcelImport.ReadDecimal(sheet, row, 5, IMPORT_HEADERS[4]),
            ProductWeight = ExcelImport.ReadDecimal(sheet, row, 6, IMPORT_HEADERS[5])
        };
        ExcelImport.ValidateRow(product, row);
        return product;
    }
}
