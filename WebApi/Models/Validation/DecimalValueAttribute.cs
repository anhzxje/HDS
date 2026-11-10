using System.ComponentModel.DataAnnotations;

namespace WebApi.Models.Validation;

public sealed class DecimalValueAttribute : ValidationAttribute
{
    public DecimalValueAttribute()
    {
        ErrorMessage = "{0} phải không âm, nằm trong giới hạn decimal(18,3) và có tối đa 3 chữ số thập phân.";
    }

    public override bool IsValid(object? value) =>
        value is null || value is decimal number && DecimalRules.IsValid(number);
}
