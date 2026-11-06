namespace WebApi.Models.Exceptions;

// Lưu mã sản phẩm và số dòng Excel gây lỗi trùng.
public class DuplicateProductCodeException : Exception
{
    public int RowNumber { get; }
    public string ProductCode { get; }

    public DuplicateProductCodeException(int rowNumber, string productCode)
        : base($"Dòng {rowNumber}: Mã sản phẩm '{productCode}' đã tồn tại.")
    {
        RowNumber = rowNumber;
        ProductCode = productCode;
    }
}