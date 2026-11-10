using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace WebApi.Errors;

public static class ApiProblemDetails
{
    public const string INTERNAL_ERROR_MESSAGE = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";

    public static ProblemDetails Create(HttpContext context, int status, string message)
    {
        var problem = new ProblemDetails { Status = status, Detail = message };
        Normalize(context, problem);
        return problem;
    }

    public static void Normalize(HttpContext context, ProblemDetails problem)
    {
        problem.Status ??= context.Response.StatusCode;
        if (problem.Status >= 500)
        {
            problem.Title = ReasonPhrases.GetReasonPhrase(problem.Status.Value);
            problem.Type = "about:blank";
            problem.Detail = INTERNAL_ERROR_MESSAGE;
            problem.Extensions.Clear();
        }
        problem.Title ??= ReasonPhrases.GetReasonPhrase(problem.Status.Value);
        problem.Type ??= "about:blank";
        problem.Instance ??= context.Request.Path;
        problem.Detail ??= problem is ValidationProblemDetails validation
            ? string.Join(" ", validation.Errors.Values.SelectMany(errors => errors).Distinct())
            : problem.Title;
        problem.Extensions["message"] = problem.Detail;
        problem.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;
    }
}
