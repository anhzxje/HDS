using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace WebApi.Errors;

// Chuẩn hóa cả lỗi validation tự động và lỗi controller trả trực tiếp (400/404...).
public sealed class ApiErrorResultFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is not ObjectResult { StatusCode: >= 400 } result) return;
        var status = result.StatusCode.Value;
        var problem = status >= 500
            ? ApiProblemDetails.Create(context.HttpContext, status, ApiProblemDetails.INTERNAL_ERROR_MESSAGE)
            : result.Value as ProblemDetails;
        if (problem is null)
        {
            string? message = result.Value as string;
            if (result.Value is not null && message is null)
            {
                var value = JsonSerializer.SerializeToElement(result.Value);
                if (value.ValueKind == JsonValueKind.Object && value.TryGetProperty("message", out var property))
                    message = property.GetString();
            }
            problem = ApiProblemDetails.Create(context.HttpContext, status,
                message ?? "Yêu cầu không hợp lệ.");
        }
        problem.Status = status;
        ApiProblemDetails.Normalize(context.HttpContext, problem);
        result.Value = problem;
        result.ContentTypes.Clear();
        result.ContentTypes.Add("application/problem+json");
    }

    public void OnResultExecuted(ResultExecutedContext context) { }
}
