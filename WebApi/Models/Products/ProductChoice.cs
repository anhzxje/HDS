namespace WebApi.Models.Products;

public class ProductChoice
{
    public Guid Id { get; set; }
    public string ProductCode { get; set; } = "";
    public string ProductName { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal QuantityPerBox { get; set; }
}
