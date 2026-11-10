namespace WebApi.Models.Exceptions;

public class ImportValidationException(string message, Exception? innerException = null)
    : Exception(message, innerException);
