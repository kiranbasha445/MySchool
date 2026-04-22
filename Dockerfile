FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY MySchool.Api/MySchool.Api.csproj MySchool.Api/
RUN dotnet restore MySchool.Api/MySchool.Api.csproj
COPY MySchool.Api/ MySchool.Api/
WORKDIR /src/MySchool.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8000
EXPOSE 8000
ENTRYPOINT ["dotnet", "MySchool.Api.dll"]
