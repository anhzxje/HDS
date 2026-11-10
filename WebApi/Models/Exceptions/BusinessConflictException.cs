namespace WebApi.Models.Exceptions;

public class BusinessConflictException(string message, Exception? innerException = null)
    : Exception(message, innerException);
