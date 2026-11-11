using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using WebApi.Models.Exceptions;
using WebApi.Models.SaleOuts;
using WebApi.Models.Validation;

namespace WebApi.Tests;

public class ValidationCoverageTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;
    public ValidationCoverageTests(ApiFactory factory) => _client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });

    public static IEnumerable<object[]> InvalidProducts()
    {
        foreach (var field in new[] { "productCode", "productName", "unit", "specification", "quantityPerBox", "productWeight" })
        {
            var body = Product(); body[field] = null; yield return [body, field];
        }
        foreach (var (field, limit) in new[] { ("productCode", 50), ("productName", 200), ("unit", 50), ("specification", 200) })
        {
            var body = Product(); body[field] = new string('x', limit + 1); yield return [body, field];
        }
        foreach (var value in new object[] { -1m, 0.0001m, 1000000000000000m, "not-a-number" })
        {
            var body = Product(); body["quantityPerBox"] = value; yield return [body, "quantityPerBox"];
        }
        var blank = Product(); blank["productCode"] = "   "; yield return [blank, "productCode"];
    }

    [Theory, MemberData(nameof(InvalidProducts))]
    public async Task Product_validation_returns_field_errors_before_accessing_database(Dictionary<string, object?> body, string field)
    {
        using var response = await _client.PostAsJsonAsync("/api/products", body);
        var problem = await Problem(response);
        Assert.Contains(problem.GetProperty("errors").EnumerateObject(), error => error.Name.Equals(field, StringComparison.OrdinalIgnoreCase) || error.Name.Equals("$." + field, StringComparison.OrdinalIgnoreCase));
    }

    public static IEnumerable<object[]> InvalidSaleOuts()
    {
        foreach (var field in new[] { "customerPoNo", "customerName", "orderDate", "items" })
        {
            var body = Sale(); body[field] = null; yield return [body];
        }
        foreach (var date in new[] { "not-a-date", "2026-02-30", "10/11/2026" })
        {
            var body = Sale(); body["orderDate"] = date; yield return [body];
        }
        var empty = Sale(); empty["items"] = Array.Empty<object>(); yield return [empty];
        var nullLine = Sale(); nullLine["items"] = new object?[] { null }; yield return [nullLine];
        var duplicate = Sale(); duplicate["items"] = new[] { Line(), Line() }; yield return [duplicate];
        foreach (var (field, value) in new[] { ("quantity", 0m), ("quantityPerBox", 0m), ("price", -1m), ("price", 0.0001m) })
        {
            var line = Line(); line[field] = value; var body = Sale(); body["items"] = new[] { line }; yield return [body];
        }
        var missing = Line(); missing.Remove("price"); var missingBody = Sale(); missingBody["items"] = new[] { missing }; yield return [missingBody];
        var zeroId = Line(); zeroId["productId"] = Guid.Empty; var zeroBody = Sale(); zeroBody["items"] = new[] { zeroId }; yield return [zeroBody];
    }

    [Theory, MemberData(nameof(InvalidSaleOuts))]
    public async Task Sale_out_invalid_headers_lines_and_json_required_fields_are_rejected(Dictionary<string, object?> body)
    {
        using var response = await _client.PostAsJsonAsync("/api/saleouts", body);
        await Problem(response);
    }

    [Theory]
    [InlineData("products", "pageSize=0")]
    [InlineData("products", "page=2147483647&pageSize=100")]
    [InlineData("products", "page=abc")]
    [InlineData("saleouts", "page=0")]
    [InlineData("saleouts", "pageSize=0")]
    [InlineData("saleouts", "page=2147483647&pageSize=100")]
    [InlineData("saleouts/revenue-report", "startDate=bad&endDate=2026-11-10")]
    [InlineData("saleouts/revenue-report", "")]
    public async Task Query_validation_rejects_invalid_ranges_overflow_and_types(string route, string query)
    {
        using var response = await _client.GetAsync($"/api/{route}?{query}");
        await Problem(response);
    }

    [Theory]
    [InlineData("products")]
    [InlineData("saleouts")]
    public async Task Update_requires_all_editable_fields(string route)
    {
        using var response = await _client.PutAsJsonAsync($"/api/{route}/{Guid.NewGuid()}", new { });
        await Problem(response);
    }

    [Fact]
    public async Task Update_sale_out_rejects_invalid_line_values_and_pdf_rejects_blank_number()
    {
        using var response = await _client.PutAsJsonAsync($"/api/saleouts/{Guid.NewGuid()}", new { quantity = 0m, quantityPerBox = 1m, price = 0m });
        await Problem(response);
        using var pdf = await _client.GetAsync("/api/saleouts/%20/pdf");
        await Problem(pdf);
    }

    [Fact]
    public void Empty_sale_lines_have_a_validation_error_even_when_validate_is_called_directly()
    {
        var request = new CreateSaleOutRequest { CustomerPoNo = "PO", CustomerName = "Customer", OrderDate = "2026-11-11", Items = [] };
        var error = Assert.Single(request.Validate(new ValidationContext(request)));
        Assert.Equal("Vui lòng thêm sản phẩm.", error.ErrorMessage);
    }

    [Theory]
    [InlineData("0", true, true)]
    [InlineData("0", false, false)]
    [InlineData("-1", true, false)]
    [InlineData("0.001", false, true)]
    [InlineData("0.0001", true, false)]
    [InlineData("999999999999999.999", true, true)]
    [InlineData("1000000000000000", true, false)]
    public void Decimal_storage_boundaries_are_enforced(string text, bool allowZero, bool valid) =>
        Assert.Equal(valid, DecimalRules.IsValid(decimal.Parse(text, CultureInfo.InvariantCulture), allowZero));

    [Fact]
    public void Decimal_attribute_allows_null_for_required_to_handle_but_rejects_other_types()
    {
        var attribute = new DecimalValueAttribute();
        Assert.True(attribute.IsValid(null)); Assert.True(attribute.IsValid(0m));
        Assert.False(attribute.IsValid("1")); Assert.False(attribute.IsValid(-1m));
    }

    [Theory]
    [InlineData("2026-02-30")]
    [InlineData("10/11/2026")]
    public void Invalid_order_date_is_a_business_validation_error(string date) =>
        Assert.Throws<RequestValidationException>(() => SaleOutRules.ParseOrderDate(date));

    [Fact]
    public void Leap_date_and_overflowing_box_count_have_explicit_boundaries()
    {
        Assert.Equal(new DateOnly(2024, 2, 29), SaleOutRules.ParseOrderDate("2024-02-29"));
        Assert.False(SaleOutRules.IsValidLine(DecimalRules.MAX_VALUE, 0.001m, 0m));
        Assert.Throws<RequestValidationException>(() => SaleOutRules.PrepareLine(Guid.NewGuid(), 0m, 1m, 1m));
    }

    private static Dictionary<string, object?> Product() => new()
    { ["productCode"] = "SP01", ["productName"] = "Sản phẩm", ["unit"] = "Cái", ["specification"] = "Hộp", ["quantityPerBox"] = 0m, ["productWeight"] = 0m };
    private static Dictionary<string, object?> Line() => new()
    { ["productId"] = Guid.Parse("00000000-0000-0000-0000-000000000001"), ["quantity"] = 1m, ["quantityPerBox"] = 1m, ["price"] = 0m };
    private static Dictionary<string, object?> Sale() => new()
    { ["customerPoNo"] = "PO01", ["customerName"] = "Khách hàng", ["orderDate"] = "2026-11-10", ["items"] = new[] { Line() } };

    private static async Task<JsonElement> Problem(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(400, body.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("message").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("traceId").GetString()));
        return body;
    }
}
