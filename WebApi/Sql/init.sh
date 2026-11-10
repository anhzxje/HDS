#!/usr/bin/env bash
set -euo pipefail

# Dùng SQLCMDPASSWORD từ environment, không đưa mật khẩu vào tham số lệnh.
/opt/mssql-tools18/bin/sqlcmd -S db -U sa -C -b -i /init/schema.sql
/opt/mssql-tools18/bin/sqlcmd -S db -U sa -C -b -i /init/fnSaleOutReport.sql
