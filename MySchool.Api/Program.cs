using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;
using MySchool.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ── DB ────────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Email service ─────────────────────────────────────────────────────────
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

builder.Services.AddControllers();

// ── JWT ───────────────────────────────────────────────────────────────────
var key = Encoding.UTF8.GetBytes(
    builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured."));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = false,
        ValidateAudience         = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey         = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MySchool API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http,
        Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
        Array.Empty<string>()
    }});
});

var app = builder.Build();

// ── Auto-migrate + bootstrap Principal ───────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    db.Database.Migrate();

    if (!db.Users.Any())
    {
        var email    = config["Bootstrap:PrincipalEmail"] ?? "principal@school.com";
        var password = config["Bootstrap:PrincipalPassword"] ?? "School@2024";
        var name     = config["Bootstrap:PrincipalName"] ?? "School Principal";

        db.Users.Add(new User
        {
            Name         = name,
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role         = "Principal",
            CreatedAt    = DateTime.UtcNow,
        });
        db.SaveChanges();

        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Bootstrap: Principal account created → {Email}", email);
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Run();
