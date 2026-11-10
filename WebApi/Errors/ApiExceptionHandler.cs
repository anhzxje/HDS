using Microsoft.AspNetCore.Diagnostics;
using WebApi.Models.Exceptions;

namespace WebApi.Errors;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        // Không biến lỗi lập trình/cấu hình thành lỗi dữ liệu của người dùng.
        var status = exception switch
        {
            RequestValidationException or ImportValidationException => StatusCodes.Status400BadRequest,
            BusinessConflictException or DuplicateProductCodeException => StatusCodes.Status409Conflict,
            BadHttpRequestException badRequest => badRequest.StatusCode,
            _ => StatusCodes.Status500InternalServerError
        };
        var message = status >= 500 ? ApiProblemDetails.INTERNAL_ERROR_MESSAGE
            : exception is BadHttpRequestException ? "Yêu cầu HTTP không hợp lệ." : exception.Message;
        var problem = ApiProblemDetails.Create(context, status, message);
        if (exception is DuplicateProductCodeException duplicate)
        {
            problem.Extensions["row"] = duplicate.RowNumber;
            problem.Extensions["productCode"] = duplicate.ProductCode;
        }

        if (status >= 500)
            logger.LogError(exception, "Yêu cầu {Method} {Path} thất bại. TraceId: {TraceId}",
                context.Request.Method, context.Request.Path, problem.Extensions["traceId"]);
        else
            logger.LogWarning("Yêu cầu {Method} {Path} bị từ chối ({Status}): {Message}. TraceId: {TraceId}",
                context.Request.Method, context.Request.Path, status, message, problem.Extensions["traceId"]);

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, options: null,
            contentType: "application/problem+json", cancellationToken: cancellationToken);
        return true;
    }
}
