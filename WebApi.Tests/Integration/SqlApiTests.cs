using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using OfficeOpenXml;
using WebApi.Models.SaleOuts;
using WebApi.Repositories;
using WebApi.Services.Imports;

namespace WebApi.Tests.Integration;

public class SqlApiTests(SqlApiFixture fixture) : IClassFixture<SqlApiFixture>
{
    private HttpClient Client => fixture.Client;
    private static string Unique() => Guid.NewGuid().ToString("N")[..12];
    private static object Product(string code) => new { productCode = code, productName = "Sản phẩm " + code, unit = "Cái", specification = "Hộp", quantityPerBox = 3m, productWeight = 1.005m };
    private async Task<Guid> CreateProduct(string code)
    {
        using var response = await Client.PostAsJsonAsync("/api/products", Product(code));
        return (await Json(response, HttpStatusCode.Created)).GetProperty("newId").GetGuid();
    }
    private static object Sale(string po, Guid id, string date = "2050-11-10") => new
    { customerPoNo = po, customerName = "Khách hàng", orderDate = date, items = new[] { new { productId = id, quantity = 1.005m, quantityPerBox = 1m, price = 0.1m } } };
    private async Task<string> CreateSale(string po, Guid id, string date = "2050-11-10")
    {
        using var response = await Client.PostAsJsonAsync("/api/saleouts", Sale(po, id, date));
        return (await Json(response, HttpStatusCode.Created)).GetProperty("saleOutNo").GetString()!;
    }
    private async Task<JsonElement> Get(string path)
    { using var response = await Client.GetAsync(path); return await Json(response, HttpStatusCode.OK); }
    private static async Task<JsonElement> Json(HttpResponseMessage response, HttpStatusCode expected)
    {
        Assert.Equal(expected, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        if ((int)expected >= 400)
        {
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
            Assert.Equal((int)expected, body.GetProperty("status").GetInt32());
            Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("message").GetString()));
        }
        return body;
    }
    private async Task<JsonElement> Import(string resource, byte[] bytes, HttpStatusCode expected = HttpStatusCode.OK)
    {
        using var multipart = new MultipartFormDataContent();
        multipart.Add(new ByteArrayContent(bytes), "file", "data.xlsx");
        using var response = await Client.PostAsync($"/api/{resource}/import", multipart);
        return await Json(response, expected);
    }

    [SqlFact]
    public async Task Products_crud_search_paging_mapping_and_immutable_identity()
    {
        var code = "CRUD-" + Unique(); var id = await CreateProduct(code);
        await CreateProduct(code + "B");
        var page = await Get($"/api/products?field=ProductCode&keyword={code}&pageSize=1&page=2");
        Assert.Equal(2, page.GetProperty("totalCount").GetInt32());
        Assert.Equal(2, page.GetProperty("page").GetInt32());
        Assert.Equal(code + "B", page.GetProperty("items")[0].GetProperty("productCode").GetString());
        using var updated = await Client.PutAsJsonAsync($"/api/products/{id}", new { productCode = "CHANGED", productName = "CHANGED", unit = " Kg ", specification = " Bao ", quantityPerBox = 0m, productWeight = 2.125m });
        Assert.Equal(HttpStatusCode.NoContent, updated.StatusCode);
        var item = (await Get($"/api/products?field=ProductCode&keyword={code}" )).GetProperty("items")[0];
        Assert.Equal(code, item.GetProperty("productCode").GetString());
        Assert.Equal("Sản phẩm " + code, item.GetProperty("productName").GetString());
        Assert.Equal("Kg", item.GetProperty("unit").GetString());
        Assert.Equal(2.125m, item.GetProperty("productWeight").GetDecimal());
        var choices = await Get("/api/products/choices");
        Assert.Contains(choices.EnumerateArray(), p => p.GetProperty("id").GetGuid() == id && p.GetProperty("quantityPerBox").GetDecimal() == 0m);
        using var deleted = await Client.DeleteAsync($"/api/products/{id}"); Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        using var again = await Client.DeleteAsync($"/api/products/{id}"); await Json(again, HttpStatusCode.NotFound);
        using var missing = await Client.PutAsJsonAsync($"/api/products/{id}", new { unit = "Kg", specification = "Bao", quantityPerBox = 0m, productWeight = 1m });
        await Json(missing, HttpStatusCode.NotFound);
    }

    [SqlFact]
    public async Task Product_numeric_search_and_parameterized_text_do_not_expand_results()
    {
        var code = Unique(); await CreateProduct(code);
        var numeric = await Get("/api/products?field=productweight&keyword=1.005");
        Assert.Contains(numeric.GetProperty("items").EnumerateArray(), p => p.GetProperty("productCode").GetString() == code);
        Assert.Equal(0, (await Get("/api/products?field=QuantityPerBox&keyword=not-a-number")).GetProperty("totalCount").GetInt32());
        var injection = Uri.EscapeDataString("' OR 1=1 --");
        Assert.Equal(0, (await Get($"/api/products?field=ProductCode&keyword={injection}")).GetProperty("totalCount").GetInt32());
        Assert.True((await Get("/api/products")).GetProperty("totalCount").GetInt32() >= 1);
    }

    [SqlFact]
    public async Task Product_unique_constraint_and_import_rollback_preserve_existing_records()
    {
        var existing = Unique(); var candidate = Unique(); await CreateProduct(existing);
        using var duplicate = await Client.PostAsJsonAsync("/api/products", Product(existing));
        await Json(duplicate, HttpStatusCode.Conflict);
        var problem = await Import("products", TestWorkbooks.Create(ProductImportReader.IMPORT_HEADERS,
            [candidate, "Name", "Unit", "Box", 1m, 1m], [existing, "Name", "Unit", "Box", 1m, 1m]), HttpStatusCode.Conflict);
        Assert.Equal(3, problem.GetProperty("row").GetInt32()); Assert.Equal(existing, problem.GetProperty("productCode").GetString());
        Assert.Equal(0, (await Get($"/api/products?field=ProductCode&keyword={candidate}")).GetProperty("totalCount").GetInt32());
        Assert.Equal(1, (await Get($"/api/products?field=ProductCode&keyword={existing}")).GetProperty("totalCount").GetInt32());
    }

    [SqlFact]
    public async Task Product_import_success_and_export_workbook_values_match_database()
    {
        var code = Unique(); var result = await Import("products", TestWorkbooks.Create(ProductImportReader.IMPORT_HEADERS, [code, "Imported", "Unit", "Box", 0m, 1.005m]));
        Assert.Equal(1, result.GetProperty("importedCount").GetInt32());
        using var response = await Client.GetAsync("/api/products/export");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("attachment", response.Content.Headers.ContentDisposition!.ToString());
        using var workbook = new ExcelPackage(new MemoryStream(await response.Content.ReadAsByteArrayAsync()));
        var sheet = workbook.Workbook.Worksheets[0];
        var row = Enumerable.Range(2, sheet.Dimension.End.Row - 1).Single(r => sheet.Cells[r, 1].Text == code);
        Assert.Equal("Imported", sheet.Cells[row, 2].Text); Assert.Equal(1.005m, sheet.Cells[row, 6].GetValue<decimal>());
    }

    [SqlFact]
    public async Task Sale_out_crud_rounding_foreign_key_conflict_and_not_found()
    {
        var code = Unique(); var id = await CreateProduct(code); var po = Unique(); var number = await CreateSale(po, id);
        Assert.StartsWith("STO205011", number); Assert.Equal(13, number.Length);
        var item = (await Get($"/api/saleouts?field=CustomerPoNo&keyword={po}")).GetProperty("items")[0];
        Assert.Equal(id, item.GetProperty("productId").GetGuid()); Assert.Equal(code, item.GetProperty("productCode").GetString());
        Assert.Equal(2m, item.GetProperty("boxQuantity").GetDecimal()); Assert.Equal(0.101m, item.GetProperty("amount").GetDecimal());
        using var referenced = await Client.DeleteAsync($"/api/products/{id}"); await Json(referenced, HttpStatusCode.Conflict);
        var lineId = item.GetProperty("id").GetGuid();
        using var update = await Client.PutAsJsonAsync($"/api/saleouts/{lineId}", new { quantity = 10m, quantityPerBox = 3m, price = 2.345m });
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        var edited = (await Get($"/api/saleouts?field=CustomerPoNo&keyword={po}")).GetProperty("items")[0];
        Assert.Equal(4m, edited.GetProperty("boxQuantity").GetDecimal()); Assert.Equal(23.45m, edited.GetProperty("amount").GetDecimal());
        Assert.Equal(number, edited.GetProperty("saleOutNo").GetString());
        Assert.Contains((await Get("/api/saleouts/choices")).EnumerateArray(), value => value.GetString() == number);
        using var delete = await Client.DeleteAsync($"/api/saleouts/{lineId}"); Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        using var missing = await Client.DeleteAsync($"/api/saleouts/{lineId}"); await Json(missing, HttpStatusCode.NotFound);
        using var missingUpdate = await Client.PutAsJsonAsync($"/api/saleouts/{lineId}", new { quantity = 1m, quantityPerBox = 1m, price = 0m });
        await Json(missingUpdate, HttpStatusCode.NotFound);
    }

    [SqlFact]
    public async Task Sale_out_unknown_product_duplicate_po_and_concurrent_numbering()
    {
        var id = await CreateProduct(Unique()); var po = Unique(); await CreateSale(po, id);
        using var duplicate = await Client.PostAsJsonAsync("/api/saleouts", Sale(po, id)); await Json(duplicate, HttpStatusCode.Conflict);
        using var missing = await Client.PostAsJsonAsync("/api/saleouts", Sale(Unique(), Guid.NewGuid())); await Json(missing, HttpStatusCode.BadRequest);
        var numbers = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => CreateSale(Unique(), id)));
        Assert.Equal(4, numbers.Distinct().Count()); Assert.All(numbers, number => Assert.StartsWith("STO205011", number));
    }

    [SqlFact]
    public async Task Sale_out_search_uses_date_equality_and_paging_without_sql_injection()
    {
        var code = Unique(); var id = await CreateProduct(code); var po = Unique(); await CreateSale(po, id, "2048-02-29");
        var date = await Get("/api/saleouts?field=OrderDate&keyword=20480229&pageSize=1");
        Assert.Equal(20480229, date.GetProperty("items")[0].GetProperty("orderDate").GetInt32());
        Assert.Equal(0, (await Get("/api/saleouts?field=OrderDate&keyword=invalid")).GetProperty("totalCount").GetInt32());
        Assert.Equal(1, (await Get($"/api/saleouts?field=ProductCode&keyword={code}")).GetProperty("totalCount").GetInt32());
        Assert.True((await Get("/api/saleouts?pageSize=1")).GetProperty("totalCount").GetInt32() >= 1);
        Assert.Equal(0, (await Get("/api/saleouts?field=CustomerName&keyword=" + Uri.EscapeDataString("' OR 1=1 --"))).GetProperty("totalCount").GetInt32());
    }

    [SqlFact]
    public async Task Sale_out_import_groups_lines_and_rolls_back_after_later_document_conflict()
    {
        var codeA = Unique(); var codeB = Unique(); var idA = await CreateProduct(codeA); await CreateProduct(codeB);
        var groupedPo = Unique();
        var imported = await Import("saleouts", TestWorkbooks.Create(SaleOutImportReader.IMPORT_HEADERS,
            [groupedPo, "2052-01-01", "Customer", codeA, 1m, 1m, 0m], [groupedPo.ToUpperInvariant(), "2052-01-01", "CUSTOMER", codeB, 2m, 1m, 1m]));
        Assert.Equal(2, imported.GetProperty("importedCount").GetInt32());
        var grouped = (await Get($"/api/saleouts?field=CustomerPoNo&keyword={groupedPo}")).GetProperty("items");
        Assert.Equal(2, grouped.GetArrayLength()); Assert.Equal(grouped[0].GetProperty("saleOutNo").GetString(), grouped[1].GetProperty("saleOutNo").GetString());
        var existingPo = Unique(); await CreateSale(existingPo, idA); var rolledBackPo = Unique();
        await Import("saleouts", TestWorkbooks.Create(SaleOutImportReader.IMPORT_HEADERS,
            [rolledBackPo, "2050-11-10", "Customer", codeB, 1m, 1m, 1m], [existingPo, "2050-11-10", "Customer", codeA, 1m, 1m, 1m]), HttpStatusCode.Conflict);
        Assert.Equal(0, (await Get($"/api/saleouts?field=CustomerPoNo&keyword={rolledBackPo}")).GetProperty("totalCount").GetInt32());
    }

    [SqlFact]
    public async Task Import_rejects_unknown_product_without_partial_writes()
    {
        var code = Unique(); await CreateProduct(code); var po = Unique();
        await Import("saleouts", TestWorkbooks.Create(SaleOutImportReader.IMPORT_HEADERS,
            [po, "2050-11-10", "Customer", code, 1m, 1m, 1m], [po, "2050-11-10", "Customer", "missing-" + Unique(), 1m, 1m, 1m]), HttpStatusCode.BadRequest);
        Assert.Equal(0, (await Get($"/api/saleouts?field=CustomerPoNo&keyword={po}")).GetProperty("totalCount").GetInt32());
    }

    [SqlFact]
    public async Task Pdf_templates_exports_and_report_use_real_database_and_document_services()
    {
        var code = Unique(); var id = await CreateProduct(code); var number = await CreateSale(Unique(), id, "2051-03-01");
        await CreateSale(Unique(), id, "2051-03-31"); await CreateSale(Unique(), id, "2051-04-01");
        foreach (var resource in new[] { "products", "saleouts" })
        {
            using var template = await Client.GetAsync($"/api/{resource}/template"); Assert.Equal(HttpStatusCode.OK, template.StatusCode);
            using var book = new ExcelPackage(new MemoryStream(await template.Content.ReadAsByteArrayAsync()));
            Assert.Equal(resource == "products" ? "Mã sản phẩm" : "Số PO khách hàng", book.Workbook.Worksheets[0].Cells["A1"].Text);
        }
        using var pdf = await Client.GetAsync($"/api/saleouts/{number}/pdf");
        Assert.Equal(HttpStatusCode.OK, pdf.StatusCode); Assert.Equal("application/pdf", pdf.Content.Headers.ContentType!.MediaType);
        Assert.StartsWith("%PDF-", System.Text.Encoding.ASCII.GetString((await pdf.Content.ReadAsByteArrayAsync())[..5]));
        using var missing = await Client.GetAsync("/api/saleouts/MISSING/pdf"); await Json(missing, HttpStatusCode.NotFound);
        using var export = await Client.GetAsync("/api/saleouts/export"); Assert.Equal(HttpStatusCode.OK, export.StatusCode);
        using var exportBook = new ExcelPackage(new MemoryStream(await export.Content.ReadAsByteArrayAsync()));
        var exportSheet = exportBook.Workbook.Worksheets[0];
        Assert.Contains(Enumerable.Range(2, exportSheet.Dimension.End.Row - 1), row => exportSheet.Cells[row, 1].Text == number && exportSheet.Cells[row, 12].GetValue<decimal>() == 0.101m);
        await using var sql = new SqlConnection(fixture.ConnectionString);
        var mapped = Assert.Single((await sql.QueryAsync<SaleOutReportItemDto>("SELECT * FROM dbo.fnSaleOutReport(20510301, 20510331) WHERE ProductId=@id", new { id })));
        Assert.Equal(2.010m, mapped.TotalQuantity); Assert.Equal(0.202m, mapped.TotalAmount); Assert.Equal(code, mapped.ProductCode);
        using var report = await Client.GetAsync("/api/saleouts/revenue-report?startDate=2051-03-01&endDate=2051-03-31");
        Assert.Equal(HttpStatusCode.OK, report.StatusCode);
        using var reportBook = new ExcelPackage(new MemoryStream(await report.Content.ReadAsByteArrayAsync()));
        var sheet = reportBook.Workbook.Worksheets[0];
        var match = Enumerable.Range(6, sheet.Dimension.End.Row - 5).Single(row => sheet.Cells[row, 2].Text == code);
        Assert.Equal(2.010m, sheet.Cells[match, 4].GetValue<decimal>()); Assert.Equal(0.202m, sheet.Cells[match, 5].GetValue<decimal>());
        Assert.True((await Get("/api/database/check")).GetProperty("connected").GetBoolean());
    }

    [SqlFact]
    public async Task Monthly_sequence_exhaustion_rolls_back_instead_of_wrapping()
    {
        var id = await CreateProduct(Unique());
        await using var sql = new SqlConnection(fixture.ConnectionString);
        await sql.ExecuteAsync("INSERT INTO dbo.SaleOut(Id,SaleOutNo,ProductId) VALUES(NEWID(),'STO2099129999',@id)", new { id });
        var po = Unique(); using var response = await Client.PostAsJsonAsync("/api/saleouts", Sale(po, id, "2099-12-01"));
        var problem = await Json(response, HttpStatusCode.Conflict); Assert.Contains("hết mã", problem.GetProperty("message").GetString());
        Assert.Equal(0, (await Get($"/api/saleouts?field=CustomerPoNo&keyword={po}")).GetProperty("totalCount").GetInt32());
    }

    [SqlFact]
    public async Task Database_primary_key_foreign_key_and_unique_index_are_real_constraints()
    {
        var code = Unique(); var id = await CreateProduct(code);
        await using var sql = new SqlConnection(fixture.ConnectionString);
        var pk = await Assert.ThrowsAsync<SqlException>(() => sql.ExecuteAsync("INSERT INTO dbo.MasterProduct(Id,ProductCode) VALUES(@id,@code)", new { id, code = Unique() }));
        Assert.Equal(2627, pk.Number);
        var unique = await Assert.ThrowsAsync<SqlException>(() => sql.ExecuteAsync("INSERT INTO dbo.MasterProduct(Id,ProductCode) VALUES(NEWID(),@code)", new { code }));
        Assert.True(SqlServerErrors.IsDuplicateProductCode(unique));
        var fk = await Assert.ThrowsAsync<SqlException>(() => sql.ExecuteAsync("INSERT INTO dbo.SaleOut(Id,ProductId) VALUES(NEWID(),@id)", new { id = Guid.NewGuid() }));
        Assert.Equal(547, fk.Number); Assert.False(SqlServerErrors.IsDuplicateProductCode(fk));
        var nullable = await sql.QueryAsync<string>("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MasterProduct' AND IS_NULLABLE='NO'");
        Assert.Equal("Id", Assert.Single(nullable));
    }
}
