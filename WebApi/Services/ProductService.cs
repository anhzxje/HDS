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

    public Task ImportProductsAsync(IReadOnlyList<(int RowNumber, CreateProductRequest Product)> products) =>
        _productRepository.ImportProductsAsync(products);
}
