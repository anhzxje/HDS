using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using WebApi.Errors;
using WebApi.Repositories;
using Microsoft.Extensions.Configuration;

namespace WebApi.Tests;

public class ProblemDetailsCoverageTests
{
    [Fact]
    public void Server_errors_clear_sensitive_extensions_and_replace_details()
    {
        var context = new DefaultHttpContext(); context.Request.Path = "/api/products"; context.TraceIdentifier = "test-trace";
        var problem = new ProblemDetails { Status = 500, Title = "SECRET", Type = "SECRET", Detail = "SECRET" };
        problem.Extensions["sql"] = "SECRET";
        ApiProblemDetails.Normalize(context, problem);
        Assert.Equal("Internal Server Error", problem.Title); Assert.Equal("about:blank", problem.Type);
        Assert.Equal(ApiProblemDetails.INTERNAL_ERROR_MESSAGE, problem.Detail);
        Assert.False(problem.Extensions.ContainsKey("sql"));
        Assert.Equal("/api/products", problem.Instance); Assert.Equal("test-trace", problem.Extensions["traceId"]);
    }

    [Fact]
    public void Validation_errors_are_deduplicated_and_default_status_comes_from_response()
    {
        var context = new DefaultHttpContext(); context.Response.StatusCode = 400;
        var problem = new ValidationProblemDetails(new Dictionary<string, string[]> { ["Code"] = ["Required", "Required"], ["Name"] = ["Too long"] }) { Status = null };
        ApiProblemDetails.Normalize(context, problem);
        Assert.Equal(400, problem.Status); Assert.Equal("Required Too long", problem.Detail);
        Assert.Equal(problem.Detail, problem.Extensions["message"]);
        var plain = new ProblemDetails { Status = 404 }; ApiProblemDetails.Normalize(context, plain);
        Assert.Equal("Not Found", plain.Detail);
    }

    [Fact]
    public async Task Bad_http_request_uses_its_status_without_exposing_internal_exception_message()
    {
        var context = new DefaultHttpContext(); context.Response.Body = new MemoryStream();
        var handler = new ApiExceptionHandler(NullLogger<ApiExceptionHandler>.Instance);
        Assert.True(await handler.TryHandleAsync(context, new BadHttpRequestException("SECRET", 413), CancellationToken.None));
        Assert.Equal(413, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        Assert.Contains("413", json); Assert.DoesNotContain("SECRET", json);
    }

    [Fact]
    public void Repositories_fail_fast_when_connection_is_not_configured()
    {
        var empty = new ConfigurationBuilder().Build();
        Assert.Throws<InvalidOperationException>(() => new DatabaseRepository(empty));
        Assert.Throws<InvalidOperationException>(() => new ProductRepository(empty));
        Assert.Throws<InvalidOperationException>(() => new SaleOutRepository(empty));
    }
}
