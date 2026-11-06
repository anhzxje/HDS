using System.ComponentModel.DataAnnotations;

namespace WebApi.Models.Products;

// Dữ liệu API cho phép sửa; ApiController kiểm tra các thuộc tính DataAnnotations.
public class UpdateProductRequest
{
    [Required(ErrorMessage = "Đơn vị tính không được để trống.")]
    [StringLength(50, ErrorMessage = "Đơn vị tính tối đa 50 ký tự.")]
    public string? Unit { get; set; }

    [Required(ErrorMessage = "Quy cách không được để trống.")]
    [StringLength(200, ErrorMessage = "Quy cách tối đa 200 ký tự.")]
    public string? Specification { get; set; }

    [Required(ErrorMessage = "Số lượng/thùng không được để trống.")]
    [Range(0, double.MaxValue, ErrorMessage = "Số lượng/thùng phải là số dương.")]
    public decimal? QuantityPerBox { get; set; }

    [Required(ErrorMessage = "Trọng lượng không được để trống.")]
    [Range(0, double.MaxValue, ErrorMessage = "Trọng lượng phải là số dương.")]
    public decimal? ProductWeight { get; set; }
}
