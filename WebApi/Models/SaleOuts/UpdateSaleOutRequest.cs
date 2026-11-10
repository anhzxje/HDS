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
        if (!SaleOutRules.IsValidLine(Quantity, QuantityPerBox, Price))
            yield return new ValidationResult("Số liệu không hợp lệ hoặc vượt giới hạn (tối đa 3 chữ số thập phân).");
    }
}
