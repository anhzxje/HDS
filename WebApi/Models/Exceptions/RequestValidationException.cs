namespace WebApi.Models.Exceptions;

// Chỉ thông báo đã được chủ động viết cho người dùng mới được trả về client.
public class RequestValidationException(string message) : Exception(message);
