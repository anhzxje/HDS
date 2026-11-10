using System.Globalization;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebApi.Models.SaleOuts;

namespace WebApi.Services;

public class SaleOutPdfService
{
    private static readonly string[] SIGNATURE_LABELS = ["Người lập phiếu", "Người duyệt", "Thủ kho", "Người nhận"];

    public byte[] CreatePdf(IReadOnlyList<SaleOutItemDto> items)
    {
        if (items.Count == 0)
            throw new ArgumentException("Không có dữ liệu để tạo phiếu xuất hàng.");
        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(30);
            page.DefaultTextStyle(style => style.FontSize(10));
            page.Header().AlignCenter().Text("PHIẾU XUẤT HÀNG").FontSize(18).Bold();
            page.Content().PaddingTop(12).Element(container => ComposeContent(container, items));
        })).GeneratePdf();
    }

    private static void ComposeContent(IContainer container, IReadOnlyList<SaleOutItemDto> items)
    {
        container.Column(column =>
        {
            column.Spacing(8);
            column.Item().Element(details => ComposeDetails(details, items[0]));
            column.Item().Element(table => ComposeTable(table, items));
            column.Item().PaddingTop(18).Element(ComposeSignatures);
        });
    }

    private static void ComposeDetails(IContainer container, SaleOutItemDto first)
    {
        var saleOutNo = first.SaleOutNo ?? string.Empty;
        container.Row(row =>
        {
            row.RelativeItem().PaddingRight(10).Column(info =>
            {
                info.Spacing(5);
                info.Item().Row(details =>
                {
                    details.RelativeItem(3).Text(text =>
                    {
                        text.Span("Khách hàng: ").Bold();
                        text.Span(first.CustomerName ?? "");
                    });
                    details.RelativeItem(2).Text(text =>
                    {
                        text.Span("Số phiếu: ").Bold();
                        text.Span(saleOutNo);
                    });
                });
                info.Item().Text(text =>
                {
                    text.Span("Ngày đặt hàng: ").Bold();
                    text.Span(FormatDate(first.OrderDate));
                });
            });
            row.ConstantItem(64).Height(64).Image(CreateQrCode(saleOutNo));
        });
    }

    private static void ComposeTable(IContainer container, IReadOnlyList<SaleOutItemDto> items)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(30);
                columns.RelativeColumn(1.2f);
                columns.RelativeColumn(2);
                columns.RelativeColumn(1);
                columns.RelativeColumn(1);
                columns.RelativeColumn(1.3f);
            });
            table.Header(ComposeTableHeader);
            for (var index = 0; index < items.Count; index++)
                ComposeTableRow(table, items[index], index + 1);
            ComposeTableTotal(table, items.Sum(item => item.Amount));
        });
    }

    private static void ComposeTableHeader(TableCellDescriptor header)
    {
        header.Cell().Element(HeaderCell).Text("STT");
        header.Cell().Element(HeaderCell).Text("Mã sản phẩm");
        header.Cell().Element(HeaderCell).Text("Tên sản phẩm");
        header.Cell().Element(HeaderCell).Text("Số lượng");
        header.Cell().Element(HeaderCell).Text("Đơn giá");
        header.Cell().Element(HeaderCell).Text("Thành tiền");
    }

    private static void ComposeTableRow(TableDescriptor table, SaleOutItemDto item, int number)
    {
        table.Cell().Element(BodyCell).AlignCenter().Text(number.ToString());
        table.Cell().Element(BodyCell).Text(item.ProductCode ?? "");
        table.Cell().Element(BodyCell).Text(item.ProductName ?? "");
        table.Cell().Element(BodyCell).AlignRight().Text(FormatNumber(item.Quantity));
        table.Cell().Element(BodyCell).AlignRight().Text(FormatNumber(item.Price));
        table.Cell().Element(BodyCell).AlignRight().Text(FormatNumber(item.Amount));
    }

    private static void ComposeTableTotal(TableDescriptor table, decimal totalAmount)
    {
        table.Cell().ColumnSpan(3).Element(BodyCell).AlignCenter().Text("Tổng:").Bold();
        table.Cell().Element(BodyCell).Text("");
        table.Cell().Element(BodyCell).Text("");
        table.Cell().Element(BodyCell).AlignRight().Text(FormatNumber(totalAmount)).Bold();
    }

    private static void ComposeSignatures(IContainer container)
    {
        container.Row(row =>
        {
            foreach (var label in SIGNATURE_LABELS)
                row.RelativeItem().AlignCenter().Text(label).Bold();
        });
    }

    private static IContainer HeaderCell(IContainer container) =>
        container.Border(1).Background(Colors.Grey.Lighten2).Padding(4).AlignCenter();

    private static IContainer BodyCell(IContainer container) => container.Border(1).Padding(4);

    private static byte[] CreateQrCode(string saleOutNo)
    {
        using var generator = new QRCodeGenerator();
        using var qrData = generator.CreateQrCode(saleOutNo, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrData);
        return qrCode.GetGraphic(10);
    }

    private static string FormatNumber(decimal value) =>
        value.ToString("#,##0.###", CultureInfo.InvariantCulture);

    private static string FormatDate(int value)
    {
        if (DateOnly.TryParseExact(value.ToString("D8"), "yyyyMMdd", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var orderDate))
            return orderDate.ToString("dd/MM/yyyy");
        return "";
    }
}
