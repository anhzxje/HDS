namespace WebApi.Models.Exceptions;

public class ImportValidationException(string message) : Exception(message);
