#!/usr/bin/env bash
# Run xUnit/API/Dapper coverage on a new SQL container with tmpfs only.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSSQL_SA_PASSWORD="Aa1!$(openssl rand -hex 24)"
test_suffix=$(openssl rand -hex 16)
test_container="hds-sql-tests-$test_suffix"
sql_image=mcr.microsoft.com/mssql/server@sha256:cf8f0ab2ebe61feec2eed2629061a07d247f791c2a8ddda74a4ac9f06a291718
cleanup() {
  docker stop --time 30 "$test_container" >/dev/null 2>&1 || true
  unset MSSQL_SA_PASSWORD HDS_TEST_SQL_CONNECTION
}
trap cleanup EXIT
# A fresh tmpfs needs no custom setup/permission wrapper. Direct SQL entrypoint
# receives SIGTERM, unlike the upstream launch script in this image.
docker run --rm -d --name "$test_container" \
  -e ACCEPT_EULA=Y -e MSSQL_PID=Developer -e MSSQL_SA_PASSWORD \
  -p 127.0.0.1::1433 \
  --tmpfs /var/opt/mssql:uid=10001,gid=0,mode=0770,size=1073741824 \
  --entrypoint /opt/mssql/bin/sqlservr "$sql_image" >/dev/null
ready=false
for ((attempt=0; attempt<90; attempt++)); do
  if docker exec "$test_container" bash -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -Q "SELECT 1" -o /dev/null' 2>/dev/null; then
    ready=true; break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  docker logs --tail 60 "$test_container"
  echo 'Temporary SQL Server did not become ready.' >&2
  exit 1
fi
test_port=$(docker port "$test_container" 1433/tcp)
test_port=${test_port##*:}
export HDS_TEST_SQL_CONNECTION="Server=127.0.0.1,$test_port;Database=HDS_Test_$test_suffix;User Id=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True"
dotnet test WebApi.Tests/WebApi.Tests.csproj -c Release \
  --collect:'XPlat Code Coverage' --settings WebApi.Tests/coverage.runsettings \
  --logger trx --results-directory WebApi.Tests/TestResults/sql "$@"
