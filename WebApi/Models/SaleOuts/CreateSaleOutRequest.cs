using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json.Serialization;

namespace WebApi.Models.SaleOuts;

public class CreateSaleOutRequest : IValidatableObject
{
    [Required, StringLength(50)] public string CustomerPoNo { get; set; } = "";
    [Required, StringLength(200)] public string CustomerName { get; set; } = "";
    [Required] public string OrderDate { get; set; } = "";
    [Required, MinLength(1)] public List<CreateSaleOutLine> Items { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!DateTime.TryParseExact(OrderDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            yield return new ValidationResult("Ngày đặt hàng không hợp lệ.");
        if (Items == null || Items.Count == 0) yield return new ValidationResult("Vui lòng thêm sản phẩm.");
        else
        {
            if (Items.Any(x => x == null || x.ProductId == Guid.Empty || x.Quantity <= 0 || x.QuantityPerBox <= 0 || x.Price < 0 || x.Quantity > 999999999999999.999m || x.QuantityPerBox > 999999999999999.999m || x.Price > 999999999999999.999m || decimal.Round(x.Quantity, 3) != x.Quantity || decimal.Round(x.QuantityPerBox, 3) != x.QuantityPerBox || decimal.Round(x.Price, 3) != x.Price))
                yield return new ValidationResult("Thông tin sản phẩm hoặc số liệu không hợp lệ (tối đa 3 chữ số thập phân).");
            if (Items.Where(x => x != null).Select(x => x.ProductId).Distinct().Count() != Items.Count)
                yield return new ValidationResult("Sản phẩm bị trùng trong phiếu.");
        }
    }
}

public class CreateSaleOutLine
{
    [JsonRequired] public Guid ProductId { get; set; }
    [JsonRequired] public decimal Quantity { get; set; }
    [JsonRequired] public decimal QuantityPerBox { get; set; }
    [JsonRequired] public decimal Price { get; set; }
}
