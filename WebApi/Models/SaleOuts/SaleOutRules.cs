using WebApi.Models.Exceptions;
using System.Globalization;
using WebApi.Models.Validation;

namespace WebApi.Models.SaleOuts;

public static class SaleOutRules
{
    public const string DATE_FORMAT = "yyyy-MM-dd";
    public const int MAX_MONTHLY_SEQUENCE = 9999;

    public static bool IsValidLine(decimal quantity, decimal quantityPerBox, decimal price)
    {
        if (!DecimalRules.IsValid(quantity, allowZero: false) ||
            !DecimalRules.IsValid(quantityPerBox, allowZero: false) || !DecimalRules.IsValid(price))
            return false;
        if (price > 0 && quantity > DecimalRules.MAX_VALUE / price)
            return false;
        return CalculateBoxQuantity(quantity, quantityPerBox) <= DecimalRules.MAX_VALUE;
    }

    public static decimal CalculateBoxQuantity(decimal quantity, decimal quantityPerBox) =>
        decimal.Ceiling(quantity / quantityPerBox);

    public static decimal CalculateAmount(decimal quantity, decimal price) =>
        decimal.Round(quantity * price, DecimalRules.SCALE, MidpointRounding.AwayFromZero);

    public static SaleOutWriteLine PrepareLine(Guid productId, decimal quantity, decimal quantityPerBox,
        decimal price, string? productCode = null, int? rowNumber = null)
    {
        if (!IsValidLine(quantity, quantityPerBox, price))
            throw new RequestValidationException("Số liệu không hợp lệ hoặc vượt giới hạn (tối đa 3 chữ số thập phân).");
        return new(productId, quantity, quantityPerBox, price,
            CalculateBoxQuantity(quantity, quantityPerBox), CalculateAmount(quantity, price), productCode, rowNumber);
    }

    public static DateOnly ParseOrderDate(string value)
    {
        if (!DateOnly.TryParseExact(value, DATE_FORMAT, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var orderDate))
            throw new RequestValidationException("Ngày đặt hàng không hợp lệ.");
        return orderDate;
    }

    public static string CreateNumber(string prefix, int sequence)
    {
        if (sequence < 1 || sequence > MAX_MONTHLY_SEQUENCE)
            throw new BusinessConflictException("Đã hết mã phiếu trong tháng.");
        return prefix + sequence.ToString("D4", CultureInfo.InvariantCulture);
    }
}
