namespace WebApi.Models.SaleOuts;

public class SaleOutItemDto
{
    public Guid ID { get; set; }

    // Mã số phiếu tự sinh
    public string? SaleOutNo { get; set;}

     // Số PO khách hàng
    public string? CustomerPoNo { get; set;} 

    // Ngày đặt hàng lưu dạng số nguyên yyyyMMdd 
    public int OrderDate { get; set;}

    // Tên khách hàng
    public string? CustomerName { get; set; }

    // Khóa ngoại liên kết MasterProduct
    public Guid ProductId { get; set;}

    // Thông tin lấy từ bảng MasterProduct
    public string? ProductCode { get; set;}
    public string? ProductName { get; set;}
    public string? Unit { get; set;}

    // Số lượng và quy cách
    public decimal Quantity { get; set;}
    public decimal QuantityPerBox { get; set; }
    public decimal BoxQuantity { get; set; }

    // Đơn giá và thành tiền
    public decimal Price { get; set; }
    public decimal Amount { get; set; }
}