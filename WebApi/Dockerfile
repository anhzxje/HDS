# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble@sha256:fe0fd4e93bd2fbb47c883b7a6369e5c8d3db8bf01cdc5981f6ee35fbdf3ff4fb AS build
WORKDIR /src
COPY WebApi/WebApi.csproj WebApi/
RUN dotnet restore WebApi/WebApi.csproj
COPY WebApi/ WebApi/
RUN dotnet publish WebApi/WebApi.csproj -c Release --no-restore -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble@sha256:bfd912c83295ce66d4b706ebb8541b9f14259b0e76fbb88b2751f58ce2399d2e AS final
WORKDIR /app
# Native PDF/font dependencies; curl probes the existing database endpoint.
USER root
RUN apt-get update && apt-get install -y --no-install-recommends libfontconfig1 fonts-dejavu-core curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080 ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
USER $APP_UID
HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=5 \
    CMD curl --fail --silent --show-error --max-time 8 http://127.0.0.1:8080/api/database/check | grep -q '"connected":true' || exit 1
STOPSIGNAL SIGTERM
ENTRYPOINT ["dotnet", "WebApi.dll"]
