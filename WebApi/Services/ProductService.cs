using WebApi.Models.Exceptions;
using WebApi.Services.Imports;
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

    public async Task<(IEnumerable<ProductItemDto> Items, int TotalCount)> GetProductsAsync(
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
            throw new RequestValidationException("Trường tìm kiếm không hợp lệ.");
        }

        return await _productRepository.GetProductsAsync(columnName, keyword, page, pageSize);
    }

    public Task<bool> UpdateProductAsync(Guid id, UpdateProductRequest request) =>
        _productRepository.UpdateProductAsync(id, request);

    public Task<bool> DeleteProductAsync(Guid id) => _productRepository.DeleteProductAsync(id);

    public Task<Guid> CreateProductAsync(CreateProductRequest request) =>
        _productRepository.CreateProductAsync(request);

    public Task<IEnumerable<ProductChoice>> GetProductChoicesAsync() => _productRepository.GetProductChoicesAsync();

    public Task<IEnumerable<ProductItemDto>> GetAllProductsAsync() => _productRepository.GetAllProductsAsync();

    public async Task<byte[]> ExportProductsAsync()
    {
        var products = await _productRepository.GetAllProductsAsync();
        return ExcelExport.Create("San pham", ProductImportReader.IMPORT_HEADERS,
            products.Select(product => new object?[]
            {
                product.ProductCode, product.ProductName, product.Unit, product.Specification,
                product.QuantityPerBox, product.ProductWeight
            }));
    }

    public byte[] CreateTemplate() =>
        ExcelImport.CreateTemplate("San pham", ProductImportReader.IMPORT_HEADERS);

    public async Task<int> ImportProductsAsync(IFormFile? file)
    {
        var products = await ProductImportReader.ReadAsync(file);
        await _productRepository.ImportProductsAsync(products);
        return products.Count;
    }
}
