namespace WebApi.Models.Validation;

public static class DecimalRules
{
    public const decimal MAX_VALUE = 999999999999999.999m;
    public const int SCALE = 3;

    public static bool IsValid(decimal value, bool allowZero = true) =>
        (allowZero ? value >= 0 : value > 0) &&
        value <= MAX_VALUE && decimal.Round(value, SCALE) == value;
}
