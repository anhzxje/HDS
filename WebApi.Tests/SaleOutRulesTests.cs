using System.Globalization;
using WebApi.Models.SaleOuts;
using WebApi.Models.Exceptions;

namespace WebApi.Tests;

public class SaleOutRulesTests
{
    [Theory]
    [InlineData("10", "3", "4")]
    [InlineData("12", "3", "4")]
    [InlineData("0.001", "3", "1")]
    public void Box_quantity_rounds_up(string quantity, string perBox, string expected) =>
        Assert.Equal(Parse(expected), SaleOutRules.CalculateBoxQuantity(Parse(quantity), Parse(perBox)));

    [Theory]
    [InlineData("1.005", "0.1", "0.101")]
    [InlineData("3", "12.345", "37.035")]
    [InlineData("10", "0", "0")]
    public void Amount_rounds_to_three_places_away_from_zero(string quantity, string price, string expected) =>
        Assert.Equal(Parse(expected), SaleOutRules.CalculateAmount(Parse(quantity), Parse(price)));

    [Theory]
    [InlineData("0", "1", "1")]
    [InlineData("1", "0", "1")]
    [InlineData("1", "1", "-1")]
    [InlineData("0.0001", "1", "1")]
    [InlineData("999999999999999.999", "1", "2")]
    public void Invalid_or_overflowing_lines_are_rejected(string quantity, string perBox, string price) =>
        Assert.False(SaleOutRules.IsValidLine(Parse(quantity), Parse(perBox), Parse(price)));

    [Theory]
    [InlineData(1, "STO2026110001")]
    [InlineData(9999, "STO2026119999")]
    public void Number_has_month_prefix_and_four_digit_sequence(int sequence, string expected) =>
        Assert.Equal(expected, SaleOutRules.CreateNumber("STO202611", sequence));

    [Theory]
    [InlineData(0)]
    [InlineData(10000)]
    public void Sequence_outside_monthly_range_is_rejected(int sequence) =>
        Assert.Throws<BusinessConflictException>(() => SaleOutRules.CreateNumber("STO202611", sequence));

    [Fact]
    public void Prepare_line_uses_the_same_rounding_rules()
    {
        var line = SaleOutRules.PrepareLine(Guid.NewGuid(), 1.005m, 1m, 0.1m);
        Assert.Equal(2m, line.BoxQuantity);
        Assert.Equal(0.101m, line.Amount);
    }

    private static decimal Parse(string value) => decimal.Parse(value, CultureInfo.InvariantCulture);
}
