using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json.Serialization;

namespace WebApi.Models.SaleOuts;

public class CreateSaleOutRequest : IValidatableObject
{
    [Required, StringLength(50)]
    public string CustomerPoNo { get; set; } = "";

    [Required, StringLength(200)]
    public string CustomerName { get; set; } = "";

    [Required]
    public string OrderDate { get; set; } = "";

    [Required, MinLength(1)]
    public List<CreateSaleOutLine> Items { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!DateOnly.TryParseExact(OrderDate, SaleOutRules.DATE_FORMAT,
            CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            yield return new ValidationResult("Ngày đặt hàng không hợp lệ.");
        if (Items is null || Items.Count == 0)
        {
            yield return new ValidationResult("Vui lòng thêm sản phẩm.");
            yield break;
        }
        if (Items.Any(item => item is null || item.ProductId == Guid.Empty ||
            !SaleOutRules.IsValidLine(item.Quantity, item.QuantityPerBox, item.Price)))
            yield return new ValidationResult("Thông tin sản phẩm hoặc số liệu không hợp lệ (tối đa 3 chữ số thập phân).");
        if (Items.Where(item => item is not null).Select(item => item.ProductId).Distinct().Count() != Items.Count)
            yield return new ValidationResult("Sản phẩm bị trùng trong phiếu.");
    }
}

public class CreateSaleOutLine
{
    [JsonRequired] public Guid ProductId { get; set; }
    [JsonRequired] public decimal Quantity { get; set; }
    [JsonRequired] public decimal QuantityPerBox { get; set; }
    [JsonRequired] public decimal Price { get; set; }
}
