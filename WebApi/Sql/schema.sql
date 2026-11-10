-- -- Thiết lập database mới; chạy một lần trên SQL Server.
-- CREATE DATABASE [HDS_Intern];
-- GO

-- USE [HDS_Intern];
-- GO

-- CREATE TABLE dbo.MasterProduct
-- (
--     Id uniqueidentifier NOT NULL CONSTRAINT PK_MasterProduct PRIMARY KEY,
--     ProductCode nvarchar(50) NULL,
--     ProductName nvarchar(200) NULL,
--     Unit nvarchar(50) NULL,
--     Specification nvarchar(200) NULL,
--     QuantityPerBox decimal(18, 3) NULL CONSTRAINT DF_MasterProduct_QuantityPerBox DEFAULT (0),
--     ProductWeight decimal(18, 3) NULL CONSTRAINT DF_MasterProduct_ProductWeight DEFAULT (0)
-- );

-- CREATE TABLE dbo.SaleOut
-- (
--     Id uniqueidentifier NOT NULL CONSTRAINT PK_SaleOut PRIMARY KEY,
--     SaleOutNo nvarchar(50) NULL,
--     CustomerPoNo nvarchar(50) NULL,
--     OrderDate int NULL,
--     CustomerName nvarchar(200) NULL,
--     ProductId uniqueidentifier NULL,
--     Quantity decimal(18, 3) NULL CONSTRAINT DF_SaleOut_Quantity DEFAULT (0),
--     Price decimal(18, 3) NULL CONSTRAINT DF_SaleOut_Price DEFAULT (0),
--     Amount decimal(18, 3) NULL CONSTRAINT DF_SaleOut_Amount DEFAULT (0),
--     QuantityPerBox decimal(18, 3) NULL CONSTRAINT DF_SaleOut_QuantityPerBox DEFAULT (0),
--     BoxQuantity decimal(18, 3) NULL CONSTRAINT DF_SaleOut_BoxQuantity DEFAULT (0),
--     CONSTRAINT FK_SaleOut_MasterProduct FOREIGN KEY (ProductId) REFERENCES dbo.MasterProduct(Id)
-- );

-- CREATE UNIQUE INDEX INDEX_MasterProduct_ProductCode ON dbo.MasterProduct(ProductCode);
-- CREATE INDEX INDEX_SaleOut_ProductId ON dbo.SaleOut(ProductId);
-- CREATE INDEX INDEX_SaleOut_CustomerPoNo_ProductId ON dbo.SaleOut(CustomerPoNo, ProductId);
