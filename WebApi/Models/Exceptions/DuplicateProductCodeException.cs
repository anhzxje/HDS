namespace WebApi.Models.Exceptions;

// Lưu mã sản phẩm và số dòng Excel gây lỗi trùng.
public class DuplicateProductCodeException : Exception
{
    public int RowNumber { get; }
    public string ProductCode { get; }

    public DuplicateProductCodeException(int rowNumber, string productCode, Exception? innerException = null)
        : base($"Dòng {rowNumber}: Mã sản phẩm '{productCode}' đã tồn tại.", innerException)
    {
        RowNumber = rowNumber;
        ProductCode = productCode;
    }
}