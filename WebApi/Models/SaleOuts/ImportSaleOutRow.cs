namespace WebApi.Models.SaleOuts;

public record ImportSaleOutRow(int RowNumber, string CustomerPoNo, string OrderDate, string CustomerName,
    string ProductCode, decimal Quantity, decimal QuantityPerBox, decimal Price);
