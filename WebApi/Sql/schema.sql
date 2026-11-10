-- Thiết lập database mới; chạy một lần trên SQL Server.
IF DB_ID(N'HDS_Intern') IS NULL
    CREATE DATABASE [HDS_Intern];
GO

USE [HDS_Intern];
GO

IF OBJECT_ID(N'dbo.MasterProduct', N'U') IS NULL
CREATE TABLE dbo.MasterProduct
(
    Id uniqueidentifier NOT NULL CONSTRAINT PK_MasterProduct PRIMARY KEY,
    ProductCode nvarchar(50) NULL,
    ProductName nvarchar(200) NULL,
    Unit nvarchar(50) NULL,
    Specification nvarchar(200) NULL,
    QuantityPerBox decimal(18, 3) NULL CONSTRAINT DF_MasterProduct_QuantityPerBox DEFAULT (0),
    ProductWeight decimal(18, 3) NULL CONSTRAINT DF_MasterProduct_ProductWeight DEFAULT (0)
);

IF OBJECT_ID(N'dbo.SaleOut', N'U') IS NULL
CREATE TABLE dbo.SaleOut
(
    Id uniqueidentifier NOT NULL CONSTRAINT PK_SaleOut PRIMARY KEY,
    SaleOutNo nvarchar(50) NULL,
    CustomerPoNo nvarchar(50) NULL,
    OrderDate int NULL,
    CustomerName nvarchar(200) NULL,
    ProductId uniqueidentifier NULL,
    Quantity decimal(18, 3) NULL CONSTRAINT DF_SaleOut_Quantity DEFAULT (0),
    Price decimal(18, 3) NULL CONSTRAINT DF_SaleOut_Price DEFAULT (0),
    Amount decimal(18, 3) NULL CONSTRAINT DF_SaleOut_Amount DEFAULT (0),
    QuantityPerBox decimal(18, 3) NULL CONSTRAINT DF_SaleOut_QuantityPerBox DEFAULT (0),
    BoxQuantity decimal(18, 3) NULL CONSTRAINT DF_SaleOut_BoxQuantity DEFAULT (0),
    CONSTRAINT FK_SaleOut_MasterProduct FOREIGN KEY (ProductId) REFERENCES dbo.MasterProduct(Id)
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MasterProduct') AND name = N'INDEX_MasterProduct_ProductCode')
CREATE UNIQUE INDEX INDEX_MasterProduct_ProductCode ON dbo.MasterProduct(ProductCode);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.SaleOut') AND name = N'INDEX_SaleOut_ProductId')
CREATE INDEX INDEX_SaleOut_ProductId ON dbo.SaleOut(ProductId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.SaleOut') AND name = N'INDEX_SaleOut_CustomerPoNo_ProductId')
CREATE INDEX INDEX_SaleOut_CustomerPoNo_ProductId ON dbo.SaleOut(CustomerPoNo, ProductId);
