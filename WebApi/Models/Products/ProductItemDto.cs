namespace WebApi.Models.Products;

// Đại diện cho một dòng sản phẩm đọc từ bảng MasterProduct và trả về qua API.
public class ProductItemDto
{
    // Id dùng để xác định sản phẩm khi cập nhật hoặc xóa.
    public Guid Id { get; set; }
    // Mã và tên sản phẩm được hiển thị nhưng không được sửa qua API hiện tại.
    public string? ProductCode { get; set; }
    public string? ProductName { get; set; }
    // Các thông tin sản phẩm còn lại có thể được cập nhật.
    public string? Unit { get; set; }
    public string? Specification { get; set; }
    public decimal? QuantityPerBox { get; set; }
    public decimal? ProductWeight { get; set; }
}
