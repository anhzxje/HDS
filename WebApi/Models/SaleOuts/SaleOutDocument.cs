namespace WebApi.Models.SaleOuts;

public record SaleOutDocument(string CustomerPoNo, string CustomerName, int OrderDate,
    string NumberPrefix, IReadOnlyList<SaleOutWriteLine> Items);

public record SaleOutWriteLine(Guid ProductId, decimal Quantity, decimal QuantityPerBox, decimal Price,
    decimal BoxQuantity, decimal Amount, string? ProductCode = null, int? RowNumber = null);
