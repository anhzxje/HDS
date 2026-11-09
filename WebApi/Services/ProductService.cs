using System.ComponentModel.DataAnnotations;
using System.Globalization;
using OfficeOpenXml;
using WebApi.Models.Exceptions;
using WebApi.Models.Products;
using WebApi.Repositories;

namespace WebApi.Services;

public class ProductService
{
    private readonly ProductRepository _productRepository;

    public ProductService(ProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<(IEnumerable<Product> Items, int TotalCount)> GetProductsAsync(
        string? field,
        string? keyword,
        int page,
        int pageSize)
    {
        var allowedFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "ProductCode", "ProductCode" },
            { "ProductName", "ProductName" },
            { "Unit", "Unit" },
            { "Specification", "Specification" },
            { "QuantityPerBox", "QuantityPerBox" },
            { "ProductWeight", "ProductWeight" }
        };

        string? columnName = null;

        if (!string.IsNullOrWhiteSpace(keyword) &&
            (string.IsNullOrWhiteSpace(field) || !allowedFields.TryGetValue(field, out columnName)))
        {
            throw new ArgumentException("Trường tìm kiếm không hợp lệ.", nameof(field));
        }

        return await _productRepository.GetProductsAsync(columnName, keyword, page, pageSize);
    }

    public Task<bool> UpdateProductAsync(Guid id, UpdateProductRequest request) =>
        _productRepository.UpdateProductAsync(id, request);

    public Task<bool> DeleteProductAsync(Guid id) => _productRepository.DeleteProductAsync(id);

    public Task<Guid> CreateProductAsync(CreateProductRequest request) =>
        _productRepository.CreateProductAsync(request);

    public Task<IEnumerable<Product>> GetAllProductsAsync() => _productRepository.GetAllProductsAsync();

    private static readonly string[] ImportHeaders = ["Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Quy cách", "Số lượng/thùng", "Trọng lượng"];

    public byte[] CreateTemplate()
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("San pham");
        for (var i = 0; i < ImportHeaders.Length; i++) sheet.Cells[1, i + 1].Value = ImportHeaders[i];
        sheet.Cells[1, 1, 1, ImportHeaders.Length].Style.Font.Bold = true;
        sheet.Cells[1, 1, 1, ImportHeaders.Length].AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<int> ImportProductsAsync(IFormFile? file)
    {
        // 1. Kiểm tra file.
        if (file == null || file.Length == 0)
        {
            throw new ImportValidationException("Vui lòng chọn file Excel có dữ liệu.");
        }

        if (!string.Equals(
            Path.GetExtension(file.FileName),
            ".xlsx",
            StringComparison.OrdinalIgnoreCase))
        {
            throw new ImportValidationException("Chỉ hỗ trợ file Excel có định dạng .xlsx.");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            throw new ImportValidationException("Dung lượng file không được vượt quá 5 MB.");
        }

        // Danh sách giữ cả số dòng Excel để thông báo lỗi chính xác.
        var products =
            new List<ImportProductRow>();

        // 2. Đọc file Excel.
        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            using var package = new ExcelPackage(stream);

            if (package.Workbook.Worksheets.Count == 0)
            {
                throw new ImportValidationException("File Excel không có sheet dữ liệu.");
            }

            // Đọc sheet đầu tiên.
            var worksheet = package.Workbook.Worksheets[0];

            if (worksheet.Dimension == null)
            {
                throw new ImportValidationException("Sheet Excel đang trống.");
            }

            // 3. Kiểm tra tên và thứ tự các cột.
            for (var column = 1; column <= ImportHeaders.Length; column++)
            {
                var actualHeader = worksheet.Cells[1, column].Text.Trim();

                if (!string.Equals(
                    actualHeader,
                    ImportHeaders[column - 1],
                    StringComparison.OrdinalIgnoreCase))
                {
                    throw new ImportValidationException($"Tiêu đề cột {column} không đúng. " +
                            $"Cần là '{ImportHeaders[column - 1]}'.");
                }
            }

            // 4. Đọc từng dòng dữ liệu, bắt đầu từ hàng 2.
            var lastRow = worksheet.Dimension.End.Row;

            for (var row = 2; row <= lastRow; row++)
            {
                // Bỏ qua dòng hoàn toàn trống trong 6 cột.
                var isEmptyRow = Enumerable.Range(1, 6)
                    .All(column =>
                        string.IsNullOrWhiteSpace(
                            worksheet.Cells[row, column].Text));

                if (isEmptyRow)
                {
                    continue;
                }

                string productCode = worksheet.Cells[row, 1].Text.Trim();
                string productName = worksheet.Cells[row, 2].Text.Trim();
                string unit = worksheet.Cells[row, 3].Text.Trim();
                string specification = worksheet.Cells[row, 4].Text.Trim();

                // Đọc giá trị số theo định dạng không phụ thuộc ngôn ngữ máy chủ.
                string quantityText = Convert.ToString(
                    worksheet.Cells[row, 5].Value,
                    CultureInfo.InvariantCulture) ?? "";

                string weightText = Convert.ToString(
                    worksheet.Cells[row, 6].Value,
                    CultureInfo.InvariantCulture) ?? "";

                if (!decimal.TryParse(
                    quantityText,
                    NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                    CultureInfo.InvariantCulture,
                    out var quantityPerBox))
                {
                    throw new ImportValidationException($"Dòng {row}: Số lượng/thùng phải là số hợp lệ.");
                }

                if (!decimal.TryParse(
                    weightText,
                    NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                    CultureInfo.InvariantCulture,
                    out var productWeight))
                {
                    throw new ImportValidationException($"Dòng {row}: Trọng lượng phải là số hợp lệ.");
                }

                var product = new CreateProductRequest
                {
                    ProductCode = productCode,
                    ProductName = productName,
                    Unit = unit,
                    Specification = specification,
                    QuantityPerBox = quantityPerBox,
                    ProductWeight = productWeight
                };

                // 5. Dùng lại các quy tắc Required, StringLength, Range
                // đã khai báo trong CreateProductRequest.
                var validationResults = new List<ValidationResult>();

                bool isValid = Validator.TryValidateObject(
                    product,
                    new ValidationContext(product),
                    validationResults,
                    validateAllProperties: true);

                if (!isValid)
                {
                    var errors = validationResults
                        .Select(result => result.ErrorMessage)
                        .Where(message => !string.IsNullOrWhiteSpace(message));

                    throw new ImportValidationException($"Dòng {row}: {string.Join(" ", errors)}");
                }

                products.Add(new ImportProductRow(row, product));
            }
        }
        catch (InvalidDataException)
        {
            throw new ImportValidationException("Không đọc được file Excel. Hãy kiểm tra lại định dạng file.");
        }

        if (products.Count == 0)
        {
            throw new ImportValidationException("File không có dòng sản phẩm để nhập.");
        }

        await _productRepository.ImportProductsAsync(products);
        return products.Count;
    }
}
