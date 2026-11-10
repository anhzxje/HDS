FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY WebApi/WebApi.csproj WebApi/
RUN dotnet restore WebApi/WebApi.csproj
COPY WebApi/ WebApi/
RUN dotnet publish WebApi/WebApi.csproj -c Release --no-restore -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
# Các thư viện native/font cho xuất PDF trên Linux.
USER root
RUN apt-get update && apt-get install -y --no-install-recommends libfontconfig1 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "WebApi.dll"]
