using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using WebApi.Controllers;
using WebApi.Models.Exceptions;

namespace WebApi.Tests;

public class ApiFactory : WebApplicationFactory<ProductsController>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Server=unused;Database=unused;Integrated Security=true");
        builder.ConfigureServices(services => services.AddControllers().AddApplicationPart(typeof(TestErrorsController).Assembly));
    }
}

public class ApiErrorsTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;
    public ApiErrorsTests(ApiFactory factory) => _client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });

    [Theory]
    [InlineData("/test-errors/import", 400, "File không hợp lệ.")]
    [InlineData("/test-errors/validation", 400, "Dữ liệu không hợp lệ.")]
    [InlineData("/test-errors/conflict", 409, "Dữ liệu đã tồn tại.")]
    [InlineData("/test-errors/duplicate", 409, "Dòng 2: Mã sản phẩm 'SP01' đã tồn tại.")]
    [InlineData("/test-errors/unexpected", 500, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")]
    [InlineData("/test-errors/configuration", 500, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")]
    [InlineData("/test-errors/direct-500", 500, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")]
    [InlineData("/test-errors/argument", 500, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")]
    public async Task Errors_have_safe_consistent_problem_details(string path, int status, string message)
    {
        using var response = await _client.GetAsync(path);
        var body = await AssertProblem(response, status);
        Assert.Equal(message, body.GetProperty("message").GetString());
        Assert.Equal(message, body.GetProperty("detail").GetString());
        Assert.DoesNotContain("INTERNAL_SECRET", body.ToString());
        if (path == "/test-errors/duplicate")
        {
            Assert.Equal(2, body.GetProperty("row").GetInt32());
            Assert.Equal("SP01", body.GetProperty("productCode").GetString());
        }
    }

    [Theory]
    [InlineData("/api/products?page=0", 400)]
    [InlineData("/api/saleouts?pageSize=101", 400)]
    [InlineData("/api/products?field=invalid&keyword=x", 400)]
    [InlineData("/api/saleouts?field=invalid&keyword=x", 400)]
    [InlineData("/api/saleouts/revenue-report?startDate=2026-11-10&endDate=2026-01-01", 400)]
    [InlineData("/does-not-exist", 404)]
    [InlineData("/api/products/00000000-0000-0000-0000-000000000001", 405)]
    public async Task Direct_controller_and_routing_errors_use_same_format(string path, int status)
    {
        using var response = await _client.GetAsync(path);
        await AssertProblem(response, status);
    }

    [Fact]
    public async Task Model_validation_keeps_field_errors()
    {
        using var response = await _client.PostAsJsonAsync("/api/products", new { });
        var body = await AssertProblem(response, 400);
        Assert.True(body.GetProperty("errors").TryGetProperty("ProductCode", out _));
    }

    [Fact]
    public async Task Malformed_json_returns_problem_details()
    {
        using var content = new StringContent("{", System.Text.Encoding.UTF8, "application/json");
        using var response = await _client.PostAsync("/api/products", content);
        await AssertProblem(response, 400);
    }

    private static async Task<JsonElement> AssertProblem(HttpResponseMessage response, int status)
    {
        Assert.Equal((HttpStatusCode)status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(status, body.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrEmpty(body.GetProperty("message").GetString()));
        Assert.False(string.IsNullOrEmpty(body.GetProperty("traceId").GetString()));
        return body;
    }
}

[ApiController]
[Route("test-errors")]
public class TestErrorsController : ControllerBase
{
    [HttpGet("validation")] public IActionResult Validation() => throw new RequestValidationException("Dữ liệu không hợp lệ.");
    [HttpGet("conflict")] public IActionResult ConflictError() => throw new BusinessConflictException("Dữ liệu đã tồn tại.");
    [HttpGet("import")] public IActionResult Import() => throw new ImportValidationException("File không hợp lệ.");
    [HttpGet("duplicate")] public IActionResult Duplicate() => throw new DuplicateProductCodeException(2, "SP01");
    [HttpGet("unexpected")] public IActionResult Unexpected() => throw new Exception("INTERNAL_SECRET");
    [HttpGet("configuration")] public IActionResult Configuration() => throw new InvalidOperationException("INTERNAL_SECRET");
    [HttpGet("direct-500")] public IActionResult DirectError() => Problem(detail: "INTERNAL_SECRET", statusCode: 500);
    [HttpGet("argument")] public IActionResult Argument() => throw new ArgumentException("INTERNAL_SECRET");
}
