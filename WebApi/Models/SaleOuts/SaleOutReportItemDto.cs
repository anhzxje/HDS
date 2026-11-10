namespace WebApi.Models.SaleOuts;

public class SaleOutReportItemDto
{
    public Guid ProductId { get; set; }

    public string? ProductCode { get; set; }

    public string? ProductName { get; set; }

    public decimal TotalQuantity { get; set; }

    public decimal TotalAmount { get; set; }
}