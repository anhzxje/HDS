using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WebApi.Models.SaleOuts;

public class UpdateSaleOutRequest : IValidatableObject
{
    [JsonRequired] public decimal Quantity { get; set; }
    [JsonRequired] public decimal QuantityPerBox { get; set; }
    [JsonRequired] public decimal Price { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        const decimal max = 999999999999999.999m;
        if (Quantity <= 0 || QuantityPerBox <= 0 || Price < 0 ||
            Quantity > max || QuantityPerBox > max || Price > max ||
            decimal.Round(Quantity, 3) != Quantity || decimal.Round(QuantityPerBox, 3) != QuantityPerBox || decimal.Round(Price, 3) != Price ||
            (Price > 0 && Quantity > max / Price) || (QuantityPerBox > 0 && Quantity / QuantityPerBox > max))
            yield return new ValidationResult("Số liệu không hợp lệ hoặc vượt giới hạn (tối đa 3 chữ số thập phân).");
    }
}
