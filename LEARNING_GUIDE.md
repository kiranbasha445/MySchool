# MySchool — Build From Scratch: Brick by Brick

> **How to use this guide**
> Each brick = write code → run → verify it works → understand the concept.
> Never move to the next brick until the current one compiles and runs.
> Write every line yourself. No copy-paste.

---

## Versions Used (exact — do not deviate)

| Package | Version |
|---------|---------|
| .NET SDK | **8.0** |
| `Microsoft.EntityFrameworkCore` | **8.0.0** |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | **8.0.0** |
| `Microsoft.EntityFrameworkCore.Tools` | **8.0.0** |
| `Microsoft.EntityFrameworkCore.Design` | **8.0.0** |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | **8.0.0** |
| `BCrypt.Net-Next` | **4.1.0** |
| `Swashbuckle.AspNetCore` | **6.5.0** |
| PostgreSQL (Docker) | **16** |

---

# BRICK 1 — Create the Solution and Project

**What you're building:** An empty Web API that runs and responds to a health check.

**Concept learned:** Solution vs project, minimal hosting model, top-level statements.

---

### The Concept

**Solution (`.sln`)** — a container file that groups one or more projects. Visual Studio and Rider use it. It contains no code, just references to project files.

**Project (`.csproj`)** — the actual project. Defines the target framework, NuGet packages, and build settings.

**Minimal Hosting Model** — before .NET 6 there were two files: `Startup.cs` + `Program.cs`. From .NET 6 onwards they merged into one `Program.cs` using **top-level statements** (C# 9+). The compiler generates the `class Program` and `static void Main` for you.

The two phases in `Program.cs`:
```
var builder = WebApplication.CreateBuilder(args);  ← Phase 1: register services (DI container)
var app     = builder.Build();                     ← dividing line — locks the DI container
                                                   ← Phase 2: configure middleware pipeline
app.Run();
```

---

### Write This

```bash
# Run these in your terminal
dotnet new sln -n MySchool
dotnet new webapi -n MySchool.Api --no-openapi
dotnet sln add MySchool.Api
```

Open `MySchool.Api/Program.cs` — delete everything and write it fresh:

```csharp
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

---

### Verify It Works

```bash
cd MySchool.Api
dotnet run
# Open browser: http://localhost:5000/health
# Expected: { "status": "ok" }
```

---

### Interview Questions

- What is the difference between a `.sln` and a `.csproj` file?
- What did the Minimal Hosting Model replace? Why was it introduced?
- What does `builder.Build()` do? Why can't you add services after calling it?
- What are top-level statements in C#? What does the compiler generate for you?

---

# BRICK 2 — Local Database with Docker

**What you're building:** A running PostgreSQL database on your machine.

**Concept learned:** Docker Compose for local dev databases, connection strings.

---

### The Concept

For local development, running PostgreSQL in Docker is the standard approach. You get a real database without installing PostgreSQL on your machine, and you can destroy and recreate it any time.

**Connection string format for PostgreSQL:**
```
Host=localhost;Port=5432;Database=MySchoolDb;Username=postgres;Password=postgres
```

---

### Write This

In the root of your solution (next to `MySchool.sln`), create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: myschool-db
    environment:
      POSTGRES_DB: myschooldb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    container_name: myschool-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@myschool.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Now update `MySchool.Api/appsettings.json` — replace everything with:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=MySchoolDb;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Key": "MySchoolSuperSecretKey2024MustBeAtLeast32Characters!"
  },
  "Bootstrap": {
    "PrincipalEmail": "principal@school.com",
    "PrincipalPassword": "School@2024",
    "PrincipalName": "School Principal"
  },
  "Frontend": {
    "BaseUrl": "http://localhost:5173"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "From": "noreply@school.com",
    "Password": "your-app-password",
    "FromName": "MySchool"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

---

### Verify It Works

```bash
# Start the database
docker-compose up -d

# Verify it's running
docker ps
# Should show myschool-db running

# pgAdmin is at http://localhost:5050
# Login: admin@myschool.com / admin
```

---

### Interview Questions

- What is `docker-compose up -d` doing?
- What is the difference between `POSTGRES_DB` and `POSTGRES_USER` in the environment?
- Why do we use environment variables in docker-compose instead of hardcoding in code?
- What is a Docker volume (`postgres_data`) and why do we use it?

---

# BRICK 3 — Add NuGet Packages

**What you're building:** The dependencies your app needs installed.

**Concept learned:** NuGet package management, `.csproj` structure.

---

### The Concept

**NuGet** is the .NET package manager (like npm for Node). Packages are declared in the `.csproj` file and restored automatically when you build.

`PrivateAssets="all"` on a package means it's used at development time only and not included in the published output (e.g., the EF Core CLI tools).

---

### Write This

Run these commands from inside `MySchool.Api/`:

```bash
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.0
dotnet add package BCrypt.Net-Next --version 4.1.0
dotnet add package Swashbuckle.AspNetCore --version 6.5.0
```

Open `MySchool.Api/MySchool.Api.csproj` — it should look like this (verify the versions):

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0">
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0">
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
    <PackageReference Include="BCrypt.Net-Next" Version="4.1.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>

</Project>
```

---

### Verify It Works

```bash
dotnet build
# Should succeed with no errors
```

---

### Interview Questions

- What is NuGet? How is it different from npm?
- What does `PrivateAssets="all"` do on a package reference?
- What is the difference between `dotnet restore` and `dotnet build`?
- Where are NuGet packages stored on your machine?

---

# BRICK 4 — Domain Models (Entities)

**What you're building:** The C# classes that map to database tables.

**Concept learned:** EF Core conventions, navigation properties, nullable types.

---

### The Concept

**Models / Entities** are plain C# classes (POCOs — Plain Old C# Objects). EF Core reads them and generates SQL table definitions.

**EF Core conventions — what it figures out automatically:**
- Property named `Id` → primary key (auto-increment integer)
- Property named `ClassId` where there's a `Class` navigation property → foreign key
- `string` (non-nullable) → `text NOT NULL` in PostgreSQL
- `string?` (nullable) → `text NULL` in PostgreSQL
- `int?` → nullable integer, NULL allowed

**Two kinds of navigation properties:**

*Reference navigation* (one object — the "one" side):
```csharp
public Class Class { get; set; } = null!;   // Student belongs to one Class
```

*Collection navigation* (list — the "many" side):
```csharp
public List<Student> Students { get; set; } = [];  // Class has many Students
```

**`= null!`** — The `!` operator silences the nullable compiler warning. You're telling the compiler: "I know this looks null, but EF Core will populate it from the database — trust me." Use only on navigation properties.

**`= []`** — C# 12 collection expression for `new List<Student>()`. Prevents null reference if EF Core doesn't load the collection.

---

### Write This

Create folder `MySchool.Api/Models/`. Then create each file:

**`Models/Class.cs`**
```csharp
namespace MySchool.Api.Models;

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<Student> Students { get; set; } = [];
}
```

**`Models/Student.cs`**
```csharp
namespace MySchool.Api.Models;

public class Student
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ProfileImage { get; set; }

    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public List<Mark> Marks { get; set; } = [];
    public List<Achievement> Achievements { get; set; } = [];
}
```

**`Models/Mark.cs`**
```csharp
namespace MySchool.Api.Models;

public class Mark
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Term { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
}
```

**`Models/Achievement.cs`**
```csharp
namespace MySchool.Api.Models;

public class Achievement
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsPublic { get; set; }

    public int? StudentId { get; set; }       // nullable — achievement can be school-wide
    public Student? Student { get; set; }     // nullable — no student linked
}
```

**`Models/Attendance.cs`**
```csharp
namespace MySchool.Api.Models;

public class Attendance
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Present"; // Present, Absent, Late, Excused
    public string? Notes { get; set; }
}
```

**`Models/User.cs`**
```csharp
namespace MySchool.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";  // Principal, Teacher, Student, Parent
    public int? LinkedStudentId { get; set; }
    public Student? LinkedStudent { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Password reset
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
```

**`Models/Enquiry.cs`**
```csharp
namespace MySchool.Api.Models;

public class Enquiry
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;
    public string ParentName { get; set; } = string.Empty;
    public string ParentEmail { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### Verify It Works

```bash
dotnet build
# All 7 model files compile with no errors
```

---

### Interview Questions

- What is a POCO? Why does EF Core use them?
- How does EF Core know `ClassId` is a foreign key without you explicitly saying so?
- What is the difference between a reference navigation property and a collection navigation property?
- Why do we use `= null!` on navigation properties instead of `= new Class()`?
- What is the difference between `int?` and `int` in an EF Core model?
- What does `= []` mean in C# 12?

---

# BRICK 5 — DbContext

**What you're building:** The class that connects your models to the database.

**Concept learned:** DbContext, DbSet, Fluent API, OnModelCreating.

---

### The Concept

`DbContext` is the heart of EF Core. It:
1. Holds the **database connection**
2. Exposes **`DbSet<T>`** properties — each one = a table you can query
3. Contains a **change tracker** — tracks which entities have been added/modified/deleted
4. Translates your **LINQ** queries into **SQL**

When you call `_context.Students` you're not hitting the database yet — you're building an expression tree. The SQL only runs when you call a terminal method like `.ToList()`, `.FirstOrDefault()`, `.Any()`, `.Count()`.

**`OnModelCreating`** is where you configure things EF Core can't infer from conventions:
- Unique indexes
- Cascade delete behavior
- Table names, column names, precision

**C# 12 Primary Constructor** — instead of writing a constructor body, you declare parameters directly on the class:
```csharp
// Old style
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}

// C# 12 primary constructor — identical result
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
```

---

### Write This

Create folder `MySchool.Api/Data/`. Create `Data/AppDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Models;

namespace MySchool.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Class> Classes { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Mark> Marks { get; set; }
    public DbSet<Achievement> Achievements { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Enquiry> Enquiries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Unique index on User.Email — no two users with the same email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Achievement.StudentId is nullable — when a Student is deleted,
        // set Achievement.StudentId to NULL instead of deleting the achievement
        modelBuilder.Entity<Achievement>()
            .HasOne(a => a.Student)
            .WithMany(s => s.Achievements)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
```

---

### Verify It Works

```bash
dotnet build
# No errors
```

---

### Deep Dive: DeleteBehavior

| Behavior | What happens when parent is deleted |
|----------|-------------------------------------|
| `Cascade` | Delete child records too (default for required FKs) |
| `SetNull` | Set FK to NULL (only if FK is nullable `int?`) |
| `Restrict` | Throw an error — refuse the delete |
| `NoAction` | Do nothing in EF Core (database decides) |

In our app: `Achievement.StudentId` is `int?` (nullable). When a student is deleted, we want the achievement to survive but lose its student link → `SetNull`.

All other relationships (Student→Class, Mark→Student, etc.) use the default `Cascade` — if a Class is deleted, its Students are deleted too.

---

### Interview Questions

- What is the EF Core change tracker? What is it tracking?
- When does EF Core actually execute SQL — when you call `.Where()` or `.ToList()`?
- What is `OnModelCreating` and when do you use it vs data annotations (`[Required]`, `[MaxLength]`)?
- What is `DeleteBehavior.Cascade` vs `DeleteBehavior.SetNull`? When would you choose each?
- What happens if you call `_context.Students.Add(student)` — what state is the entity in?

---

# BRICK 6 — Register DbContext (Dependency Injection)

**What you're building:** Wiring DbContext into the DI container so controllers can receive it.

**Concept learned:** Dependency Injection, service lifetimes, `AddDbContext`.

---

### The Concept

**Dependency Injection (DI)** means: instead of a class creating its own dependencies with `new`, it *declares* what it needs and the framework provides them.

```csharp
// Without DI — tightly coupled, impossible to test
public class StudentsController
{
    private AppDbContext _context = new AppDbContext(???);
}

// With DI — controller declares what it needs, DI container provides it
public class StudentsController
{
    private readonly AppDbContext _context;
    public StudentsController(AppDbContext context) => _context = context;
}
```

**Three lifetimes — the most asked interview topic in .NET:**

| Lifetime | Register with | Created | Destroyed | Use for |
|----------|--------------|---------|-----------|---------|
| **Singleton** | `AddSingleton` | Once at app start | App shutdown | Shared state, caches, config |
| **Scoped** | `AddScoped` | Once per HTTP request | End of request | DbContext, unit of work |
| **Transient** | `AddTransient` | Every time it's requested | When caller disposes | Lightweight, stateless services |

**Why DbContext must be Scoped:**
DbContext has a change tracker in memory. If it were Singleton, all requests share the same tracker → corrupted state, cross-request data leaks. Scoped = one per request = safe.

**The startup scope problem:**
DbContext is Scoped (needs an HTTP request). At startup there's no request. So you manually create a scope:
```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // use db here
}
```
This is a classic interview trap: injecting a Scoped service into a Singleton causes `InvalidOperationException: Cannot consume scoped service from singleton`.

---

### Write This

Update `Program.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Register DbContext as Scoped (default for AddDbContext)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

---

### Verify It Works

```bash
dotnet build
# Compiles — DI is registered but no migrations yet so the DB won't exist
```

---

### Interview Questions

- What are the three DI lifetimes? Give a real-world example of each.
- Why is DbContext Scoped and not Singleton?
- What happens if you inject a Scoped service into a Singleton?
- Why do we call `CreateScope()` at startup instead of just `app.Services.GetService<AppDbContext>()`?
- What is `GetRequiredService<T>()` vs `GetService<T>()`? Which one throws and which returns null?
- What is constructor injection? What are the alternatives (property injection, method injection)?

---

# BRICK 7 — Migrations: Create the Database Schema

**What you're building:** Auto-generated files that create your database tables from your models.

**Concept learned:** EF Core migrations, schema versioning, Up/Down methods.

---

### The Concept

When your C# models change, the database schema needs to change too. **Migrations** are generated C# files that describe those changes. Think of them as **version control for your database**.

Each migration has two methods:
- `Up()` — what to do when applying the migration (create tables, add columns)
- `Down()` — how to undo it (drop tables, remove columns)

EF Core tracks which migrations have been applied in a `__EFMigrationsHistory` table in your database.

**The three commands you use constantly:**
```bash
dotnet ef migrations add <Name>   # generate migration from model changes
dotnet ef database update         # apply pending migrations to the DB
dotnet ef migrations remove       # undo the last generated migration (before applying)
```

---

### Write This

Make sure your Docker database is running (`docker-compose up -d`), then:

```bash
cd MySchool.Api
dotnet ef migrations add InitialCreate
```

This creates a `Migrations/` folder with:
- `20xxxxxx_InitialCreate.cs` — the migration
- `AppDbContextModelSnapshot.cs` — snapshot of your current model (never edit this manually)

Open the migration file and read the `Up()` method. You'll see it creates all your tables in the correct order (Classes first, then Students which depend on Classes, etc.).

---

### Verify It Works

```bash
dotnet ef database update
# Applies the migration to PostgreSQL
# Check pgAdmin at http://localhost:5050 — you should see all 7 tables
```

What to look for in pgAdmin:
- Tables: `Classes`, `Students`, `Marks`, `Achievements`, `Attendances`, `Users`, `Enquiries`
- `__EFMigrationsHistory` table with one row
- Foreign key constraints on Students (ClassId → Classes.Id), etc.

---

### Interview Questions

- What is the `__EFMigrationsHistory` table and what does EF Core store in it?
- What is `AppDbContextModelSnapshot.cs`? Can you edit it manually?
- What is the difference between `dotnet ef database update` and `db.Database.Migrate()` in code?
- If two developers add migrations simultaneously on different branches, what happens when you merge? How do you fix it?
- What is the difference between `db.Database.Migrate()` and `db.Database.EnsureCreated()`?
- What does `Down()` do and when would you call it?

---

# BRICK 8 — Auto-Migrate + Bootstrap on Startup

**What you're building:** The app applies migrations and creates the first admin user automatically when it starts.

**Concept learned:** Startup logic with scoped services, IConfiguration, BCrypt.

---

### The Concept

**Auto-migrate on startup** means you never manually run `dotnet ef database update` on a server. Every time the app starts, it checks for unapplied migrations and runs them. This is safe to run repeatedly — EF only applies what hasn't been applied yet.

**Bootstrap** — on the very first startup, no users exist in the database. We create the Principal (admin) account automatically. The credentials come from `appsettings.json` so they're configurable per environment.

**Why `CreateScope()`** — DbContext is Scoped, but there's no HTTP request at startup. You must manually create a scope to resolve Scoped services.

---

### Write This

Update `Program.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

var app = builder.Build();

// ── Auto-migrate + bootstrap ──────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    db.Database.Migrate();

    if (!db.Users.Any())
    {
        var email    = config["Bootstrap:PrincipalEmail"]    ?? "principal@school.com";
        var password = config["Bootstrap:PrincipalPassword"] ?? "School@2024";
        var name     = config["Bootstrap:PrincipalName"]     ?? "School Principal";

        db.Users.Add(new User
        {
            Name         = name,
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role         = "Principal",
            CreatedAt    = DateTime.UtcNow,
        });
        db.SaveChanges();

        logger.LogInformation("Bootstrap: Principal created → {Email}", email);
    }
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

---

### Verify It Works

```bash
dotnet run
# In the console logs, you should see: Bootstrap: Principal created → principal@school.com
# Check pgAdmin → Users table → should have 1 row
```

---

### Deep Dive: IConfiguration

Configuration is read from `appsettings.json` and environment variables. The colon (`:`) represents nesting:
```csharp
config["Bootstrap:PrincipalEmail"]    // reads { "Bootstrap": { "PrincipalEmail": "..." } }
config.GetConnectionString("DefaultConnection")  // shortcut for ConnectionStrings:DefaultConnection
```

Environment variable override: double underscore = colon:
```bash
Bootstrap__PrincipalEmail=admin@example.com dotnet run
```

---

### Interview Questions

- Why do we use `CreateScope()` instead of injecting DbContext directly into startup code?
- What is `IConfiguration` and how does the colon `:` separator work?
- What is `??` (null coalescing operator) and how is it used here?
- What is idempotent and why must startup/bootstrap code be idempotent?
- What does `BCrypt.Net.BCrypt.HashPassword(password)` do? Why don't we store plain text?
- What is `db.Users.Any()` generating in SQL?

---

# BRICK 9 — CORS + JWT Authentication Setup

**What you're building:** Configuring the app to accept cross-origin requests and validate JWT tokens.

**Concept learned:** CORS, JWT, middleware pipeline order.

---

### The Concept — CORS

**CORS (Cross-Origin Resource Sharing)** is a browser security mechanism. When your React app (at `localhost:5173`) calls your API (at `localhost:5000`), the browser blocks it because the ports differ = different "origin". The server must explicitly allow it.

CORS only affects browser-to-server requests. Postman, curl, and server-to-server calls are never blocked.

### The Concept — JWT

**JSON Web Token (JWT)** is a self-contained token proving who the user is. Format: `header.payload.signature` (Base64, dot-separated).

The signature is generated using your secret key. Only you can generate a valid signature. The client can't fake one.

When a request arrives with `Authorization: Bearer <token>`, ASP.NET Core's JWT middleware:
1. Validates the signature using your secret key
2. Checks it hasn't expired
3. Reads the claims (user ID, name, role) from the payload
4. Sets `HttpContext.User` — now any controller can read who is logged in

### The Concept — Middleware Pipeline Order

Order is critical. Wrong order = subtle runtime bugs:

```
UseCors            ← 1st: browser preflight requests need CORS headers
UseAuthentication  ← 2nd: reads JWT, populates HttpContext.User
UseAuthorization   ← 3rd: checks [Authorize] — needs User from step 2
MapControllers     ← 4th: routes to the right controller action
```

---

### Write This

Update `Program.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MySchool.Api.Data;
using MySchool.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

// ── JWT Authentication ─────────────────────────────────────────────────────
var key = Encoding.UTF8.GetBytes(
    builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured."));

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

var app = builder.Build();

// ── Startup: migrate + bootstrap ──────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    db.Database.Migrate();

    if (!db.Users.Any())
    {
        var email    = config["Bootstrap:PrincipalEmail"]    ?? "principal@school.com";
        var password = config["Bootstrap:PrincipalPassword"] ?? "School@2024";
        var name     = config["Bootstrap:PrincipalName"]     ?? "School Principal";

        db.Users.Add(new User
        {
            Name         = name,
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role         = "Principal",
            CreatedAt    = DateTime.UtcNow,
        });
        db.SaveChanges();
        logger.LogInformation("Bootstrap: Principal created → {Email}", email);
    }
}

// ── Middleware pipeline — ORDER MATTERS ───────────────────────────────────
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

---

### Verify It Works

```bash
dotnet run
# App starts, no errors
# GET /health still works
```

---

### Interview Questions

- What is CORS? Why does the browser enforce it but Postman doesn't?
- What is a CORS preflight request? When does the browser send one?
- What are the three parts of a JWT?
- Why can't a client tamper with JWT claims?
- What is the difference between `ValidateIssuer` and `ValidateAudience`?
- What is `SymmetricSecurityKey` vs `RsaSecurityKey`?
- What is `DefaultAuthenticateScheme` vs `DefaultChallengeScheme`?
- Why must `UseCors()` come before `UseAuthentication()`?
- What happens if you put `UseAuthorization()` before `UseAuthentication()`?

---

# BRICK 10 — Swagger with Bearer Auth

**What you're building:** Interactive API documentation that supports JWT tokens.

**Concept learned:** OpenAPI/Swagger, security definitions.

---

### The Concept

**Swagger (OpenAPI)** auto-generates interactive documentation from your controllers. You can test every endpoint directly in the browser at `/swagger`.

The **security definition** adds a padlock icon and an input field to Swagger UI so you can paste your JWT token and it will be sent with every request.

---

### Write This

Update `Program.cs` — add Swagger registration with all other services, and Swagger middleware in the pipeline:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MySchool.Api.Data;
using MySchool.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

// ── JWT Authentication ─────────────────────────────────────────────────────
var key = Encoding.UTF8.GetBytes(
    builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured."));

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

// ── Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MySchool API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name        = "Authorization",
        Type        = SecuritySchemeType.Http,
        Scheme      = "bearer",
        BearerFormat = "JWT",
        In          = ParameterLocation.Header,
        Description = "Enter your JWT token here (without the 'Bearer ' prefix)"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        },
        Array.Empty<string>()
    }});
});

var app = builder.Build();

// ── Startup ────────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    db.Database.Migrate();

    if (!db.Users.Any())
    {
        var email    = config["Bootstrap:PrincipalEmail"]    ?? "principal@school.com";
        var password = config["Bootstrap:PrincipalPassword"] ?? "School@2024";
        var name     = config["Bootstrap:PrincipalName"]     ?? "School Principal";

        db.Users.Add(new User
        {
            Name         = name,
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role         = "Principal",
            CreatedAt    = DateTime.UtcNow,
        });
        db.SaveChanges();
        logger.LogInformation("Bootstrap: Principal created → {Email}", email);
    }
}

// ── Pipeline ───────────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

---

### Verify It Works

```bash
dotnet run
# Open http://localhost:5000/swagger
# You should see the Swagger UI with a padlock icon (Authorize button)
```

---

### Interview Questions

- What is the difference between Swagger and OpenAPI?
- What does `AddEndpointsApiExplorer()` do?
- What does `AddSecurityRequirement` do vs `AddSecurityDefinition`?
- Why would you disable Swagger in production?

---

# BRICK 11 — AuthController (Login, Signup, Password Reset)

**What you're building:** Authentication endpoints — the core of the security system.

**Concept learned:** Controllers, routing, DTOs, JWT generation, claims, BCrypt, secure password reset, email enumeration.

---

### The Concept — Controllers & Routing

A **controller** handles HTTP requests. Attributes on the class and methods define the routing:

```
[ApiController]              → enables auto model validation + automatic 400 responses
[Route("api/[controller]")] → base URL: /api/auth (class name minus "Controller")
[HttpPost("login")]          → POST /api/auth/login
[HttpGet("{id}")]            → GET /api/auth/5  (id comes from URL)
```

**`[ApiController]` automatically:**
1. Validates the model — if a required field is missing → 400 Bad Request (no code needed)
2. Binds complex types from the request body (`[FromBody]` is implicit)

**IActionResult return types:**

| Method | HTTP Status | Use when |
|--------|-------------|----------|
| `Ok(data)` | 200 | Success with data |
| `BadRequest(obj)` | 400 | Invalid input |
| `Unauthorized(obj)` | 401 | Not authenticated |
| `NotFound()` | 404 | Resource not found |
| `Forbid()` | 403 | Authenticated but not allowed |

### The Concept — DTOs

A **DTO (Data Transfer Object)** is a simple class that carries data between client and server. You never expose your EF Core entity directly because:
1. Entity has `PasswordHash`, `ResetToken` — you don't want these in responses
2. **Over-posting attack**: client sends `{ "Role": "Principal" }` in signup → if you bind to `User` entity directly, they escalated their own privileges
3. Circular references: `Student` → `Marks` → `Student` → infinite JSON loop

### The Concept — JWT Generation

```csharp
// 1. Create claims — the payload of the JWT
var claims = new ClaimsIdentity([
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),  // who
    new Claim(ClaimTypes.Role, user.Role),                     // what role
]);

// 2. Describe the token
var descriptor = new SecurityTokenDescriptor
{
    Subject            = claims,
    Expires            = DateTime.UtcNow.AddHours(8),
    SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
};

// 3. Create and serialize it to a string
var handler = new JwtSecurityTokenHandler();
var token   = handler.WriteToken(handler.CreateToken(descriptor));
```

### The Concept — Secure Password Reset

```
1. User submits email → generate a random token → store with 1-hour expiry → send email with link
2. User clicks link → POST token + new password → find user by token AND check not expired → update password → clear token
```

Key security decisions:
- **Always return the same message** (whether email exists or not) → prevents email enumeration
- **`RandomNumberGenerator`** not `Random` → cryptographically secure
- **Clear the token after use** → one-time use only

---

### Write This

Create `Controllers/AuthController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MySchool.Api.Data;
using MySchool.Api.Models;
using MySchool.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext  _context;
    private readonly IConfiguration _config;
    private readonly IEmailService  _email;

    public AuthController(AppDbContext context, IConfiguration config, IEmailService email)
    {
        _context = context;
        _config  = config;
        _email   = email;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────
    public class LoginDto
    {
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SignupDto
    {
        public string  Name             { get; set; } = string.Empty;
        public string  Email            { get; set; } = string.Empty;
        public string  Password         { get; set; } = string.Empty;
        public string  Role             { get; set; } = "Student";
        public int?    LinkedStudentId  { get; set; }
    }

    public class ForgotPasswordDto { public string Email { get; set; } = string.Empty; }

    public class ResetPasswordDto
    {
        public string Token       { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword     { get; set; } = string.Empty;
    }

    // ── Login ─────────────────────────────────────────────────────────────
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive." });

        return Ok(new { token = GenerateToken(user), user = new
        {
            id              = user.Id,
            name            = user.Name,
            email           = user.Email,
            role            = user.Role,
            linkedStudentId = user.LinkedStudentId
        }});
    }

    // ── Signup ────────────────────────────────────────────────────────────
    [HttpPost("signup")]
    public IActionResult Signup([FromBody] SignupDto dto)
    {
        if (_context.Users.Any(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already in use." });

        var user = new User
        {
            Name            = dto.Name,
            Email           = dto.Email,
            PasswordHash    = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role            = dto.Role,
            LinkedStudentId = dto.LinkedStudentId
        };

        _context.Users.Add(user);
        _context.SaveChanges();

        return Ok(new { message = "Account created successfully." });
    }

    // ── Forgot password ───────────────────────────────────────────────────
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email.Trim().ToLower());

        // Always return 200 — prevents email enumeration attack
        if (user == null)
            return Ok(new { message = "If that email is registered, a reset link has been sent." });

        var token             = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.ResetToken       = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        var frontendBase = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        await _email.SendPasswordResetAsync(user.Email, user.Name, $"{frontendBase}/reset-password?token={token}");

        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    // ── Reset password ────────────────────────────────────────────────────
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Token and new password are required." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = _context.Users.FirstOrDefault(u =>
            u.ResetToken == dto.Token &&
            u.ResetTokenExpiry > DateTime.UtcNow);  // token AND not expired

        if (user == null)
            return BadRequest(new { message = "This reset link is invalid or has expired." });

        user.PasswordHash     = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.ResetToken       = null;      // clear — one-time use
        user.ResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password updated successfully. You can now log in." });
    }

    // ── Change own password (while logged in) ─────────────────────────────
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var user   = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }

    // ── Private: generate JWT ─────────────────────────────────────────────
    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name,           user.Email),
                new Claim(ClaimTypes.GivenName,      user.Name),
                new Claim(ClaimTypes.Role,           user.Role)
            ]),
            Expires            = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(descriptor));
    }
}
```

**Important:** `AuthController` depends on `IEmailService`. You haven't written that yet — the app won't build until Brick 16. For now, add a temporary stub so you can test login. Skip this if you plan to do Brick 16 immediately.

Alternatively, build Brick 16 first, then come back and test here.

---

### Verify It Works

```bash
dotnet run
# In Swagger: POST /api/auth/login
# Body: { "email": "principal@school.com", "password": "School@2024" }
# Expected: 200 with { "token": "eyJ...", "user": { ... } }

# Copy the token, click "Authorize" in Swagger, paste the token
```

---

### Interview Questions

- What does `[ApiController]` do for model validation?
- What is an over-posting attack? How does a DTO prevent it?
- What is `ClaimTypes.NameIdentifier` — what value does it hold?
- What is `BCrypt.Verify` doing? Where is the salt stored?
- What is email enumeration? Why do we return the same message whether the email exists or not?
- Why is `RandomNumberGenerator` better than `new Random()` for security tokens?
- What is `User.FindFirst(ClaimTypes.NameIdentifier)` — where does `User` come from?
- What is the difference between `Unauthorized()` (401) and `Forbid()` (403)?

---

# BRICK 12 — ClassesController

**What you're building:** CRUD endpoints for school classes.

**Concept learned:** Role-based authorization, EF Core queries with Include + projection.

---

### The Concept — Role-Based Authorization

```csharp
[Authorize]                          // any authenticated user can call this
[Authorize(Roles = "Principal")]     // only Principal
[Authorize(Roles = "Principal,Teacher")]  // Principal OR Teacher
```

`[Authorize]` on the **class** = all actions require authentication unless overridden.
`[Authorize(Roles = ...)]` on an **action** = adds an extra role requirement on top.

If a valid JWT is present but the role doesn't match → `Forbid()` → **403 Forbidden**.
If no JWT at all → **401 Unauthorized**.

### The Concept — LINQ Projection

Instead of loading full entities and then filtering in memory, project exactly what you need. EF generates a SQL `SELECT` with only those columns:

```csharp
// Loads all Student data — wasteful
var classes = _context.Classes.Include(c => c.Students).ToList();

// Projects only Id, Name, StudentCount — efficient SQL
var classes = _context.Classes
    .Include(c => c.Students)
    .Select(c => new { c.Id, c.Name, StudentCount = c.Students.Count })
    .ToList();
```

---

### Write This

Create `Controllers/ClassesController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _context;
    public ClassesController(AppDbContext context) => _context = context;

    [HttpGet]
    public IActionResult GetClasses()
    {
        var classes = _context.Classes
            .Include(c => c.Students)
            .Select(c => new { c.Id, c.Name, StudentCount = c.Students.Count })
            .OrderBy(c => c.Name)
            .ToList();

        return Ok(classes);
    }

    [HttpGet("{id}")]
    public IActionResult GetClass(int id)
    {
        var cls = _context.Classes
            .Include(c => c.Students).ThenInclude(s => s.Marks)
            .FirstOrDefault(c => c.Id == id);

        if (cls == null) return NotFound();

        return Ok(new
        {
            cls.Id,
            cls.Name,
            Capacity = 40,
            Students = cls.Students
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.ProfileImage,
                    AverageScore = s.Marks.Count > 0
                        ? Math.Round(s.Marks.Average(m => m.Score), 1)
                        : (double?)null
                })
                .OrderBy(s => s.Name)
                .ToList()
        });
    }

    public class CreateClassDto
    {
        public string Name { get; set; } = string.Empty;
    }

    [HttpPost]
    [Authorize(Roles = "Principal")]
    public IActionResult CreateClass([FromBody] CreateClassDto dto)
    {
        if (_context.Classes.Any(c => c.Name == dto.Name))
            return BadRequest(new { message = "A class with that name already exists." });

        var cls = new Class { Name = dto.Name };
        _context.Classes.Add(cls);
        _context.SaveChanges();
        return Ok(cls);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal")]
    public IActionResult DeleteClass(int id)
    {
        var cls = _context.Classes.Find(id);
        if (cls == null) return NotFound();

        _context.Classes.Remove(cls);
        _context.SaveChanges();
        return Ok(new { message = "Class deleted." });
    }
}
```

---

### Verify It Works

```bash
# In Swagger — first login and authorize with your token, then:
# GET /api/classes → 200 with empty array (no classes yet)
# POST /api/classes { "name": "Class 1" } → 200 with the created class
# GET /api/classes → 200 with [{ "id": 1, "name": "Class 1", "studentCount": 0 }]
# DELETE /api/classes/1 → 200
```

---

### Interview Questions

- What is the difference between `[Authorize]` on a class vs on a method?
- What happens if `[Authorize]` is on the class and `[AllowAnonymous]` is on a method?
- What is `ThenInclude` and when do you need it vs `Include`?
- What is the difference between `_context.Classes.Find(id)` and `_context.Classes.FirstOrDefault(c => c.Id == id)`?
- What is LINQ projection (`.Select()`)?  What SQL does EF generate?

---

# BRICK 13 — StudentsController

**What you're building:** CRUD for students, with resource-based authorization for Student and Parent roles.

**Concept learned:** Resource-based authorization, reading claims in controllers, `Forbid()`.

---

### The Concept — Resource-Based Authorization

Role-based auth checks the role: "is this person a Teacher?"
Resource-based auth checks ownership: "is this person trying to access THEIR data?"

In our app, a Student user can only view their own student record. A Parent can only view their linked child. Both roles have a `LinkedStudentId` on their User record.

```csharp
// Reading the JWT claims inside a controller action
var role   = User.FindFirst(ClaimTypes.Role)?.Value;
var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

// Check ownership
var user = _context.Users.Find(userId);
if (user?.LinkedStudentId != requestedStudentId)
    return Forbid();  // authenticated, but not allowed THIS resource
```

`User` (capital U) is a property on `ControllerBase` — it's the `ClaimsPrincipal` populated by JWT middleware from the token.

---

### Write This

Create `Controllers/StudentsController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _context;
    public StudentsController(AppDbContext context) => _context = context;

    [HttpGet]
    public IActionResult GetStudents()
    {
        var students = _context.Students
            .Include(s => s.Class)
            .Include(s => s.Marks)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.ProfileImage,
                s.ClassId,
                ClassName    = s.Class.Name,
                MarksCount   = s.Marks.Count,
                AverageScore = s.Marks.Any()
                    ? Math.Round(s.Marks.Average(m => m.Score), 1)
                    : (double?)null
            })
            .OrderBy(s => s.ClassName).ThenBy(s => s.Name)
            .ToList();

        return Ok(students);
    }

    [HttpGet("{id}")]
    public IActionResult GetStudent(int id)
    {
        var role   = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role is "Student" or "Parent")
        {
            var user = _context.Users.Find(userId);
            if (user?.LinkedStudentId != id)
                return Forbid();
        }

        var student = _context.Students
            .Include(s => s.Class)
            .Include(s => s.Marks)
            .Include(s => s.Achievements)
            .FirstOrDefault(s => s.Id == id);

        if (student == null) return NotFound();
        return Ok(student);
    }

    public class CreateStudentDto
    {
        public string  Name         { get; set; } = string.Empty;
        public string? ProfileImage { get; set; }
        public int     ClassId      { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateStudent([FromBody] CreateStudentDto dto)
    {
        if (!_context.Classes.Any(c => c.Id == dto.ClassId))
            return BadRequest(new { message = "Class not found." });

        var student = new Student
        {
            Name         = dto.Name,
            ProfileImage = dto.ProfileImage,
            ClassId      = dto.ClassId
        };

        _context.Students.Add(student);
        _context.SaveChanges();
        return Ok(student);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult UpdateStudent(int id, [FromBody] CreateStudentDto dto)
    {
        var student = _context.Students.Find(id);
        if (student == null) return NotFound();

        student.Name         = dto.Name;
        student.ProfileImage = dto.ProfileImage;
        student.ClassId      = dto.ClassId;
        _context.SaveChanges();
        return Ok(student);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal")]
    public IActionResult DeleteStudent(int id)
    {
        var student = _context.Students.Find(id);
        if (student == null) return NotFound();

        _context.Students.Remove(student);
        _context.SaveChanges();
        return Ok(new { message = "Student deleted." });
    }
}
```

---

### Verify It Works

```bash
# POST /api/classes { "name": "Class 1" } first if you don't have one
# POST /api/students { "name": "Ahmed Hassan", "classId": 1 }
# GET /api/students → list with average scores
# GET /api/students/1 → full details with marks and achievements
```

---

### Interview Questions

- What is resource-based authorization vs role-based authorization?
- What is `User.FindFirst(ClaimTypes.Role)` — what type is `User`?
- What is the `is "Student" or "Parent"` pattern in C# (pattern matching)?
- Why do we check `user?.LinkedStudentId != id` and not just `user.LinkedStudentId != id`?
- What does `Forbid()` return vs `Unauthorized()`?

---

# BRICK 14 — MarksController

**What you're building:** CRUD for student marks, also with resource-based authorization.

**Concept learned:** `ThenInclude` for 2-level deep loading, query filtering.

---

### Write This

Create `Controllers/MarksController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MarksController : ControllerBase
{
    private readonly AppDbContext _context;
    public MarksController(AppDbContext context) => _context = context;

    [HttpGet]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult GetAllMarks()
    {
        var marks = _context.Marks
            .Include(m => m.Student).ThenInclude(s => s.Class)
            .Select(m => new
            {
                m.Id, m.Subject, m.Score, m.Term,
                m.StudentId,
                StudentName = m.Student.Name,
                ClassName   = m.Student.Class.Name
            })
            .OrderBy(m => m.ClassName).ThenBy(m => m.StudentName)
            .ToList();

        return Ok(marks);
    }

    [HttpGet("student/{studentId}")]
    public IActionResult GetMarksByStudent(int studentId)
    {
        var role   = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role is "Student" or "Parent")
        {
            var user = _context.Users.Find(userId);
            if (user?.LinkedStudentId != studentId)
                return Forbid();
        }

        var marks = _context.Marks
            .Where(m => m.StudentId == studentId)
            .Select(m => new { m.Id, m.Subject, m.Score, m.Term })
            .OrderBy(m => m.Subject)
            .ToList();

        return Ok(marks);
    }

    public class CreateMarkDto
    {
        public int     StudentId { get; set; }
        public string  Subject   { get; set; } = string.Empty;
        public int     Score     { get; set; }
        public string? Term      { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateMark([FromBody] CreateMarkDto dto)
    {
        if (!_context.Students.Any(s => s.Id == dto.StudentId))
            return BadRequest(new { message = "Student not found." });

        if (dto.Score < 0 || dto.Score > 100)
            return BadRequest(new { message = "Score must be between 0 and 100." });

        var mark = new Mark
        {
            StudentId = dto.StudentId,
            Subject   = dto.Subject,
            Score     = dto.Score,
            Term      = dto.Term
        };

        _context.Marks.Add(mark);
        _context.SaveChanges();
        return Ok(mark);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult DeleteMark(int id)
    {
        var mark = _context.Marks.Find(id);
        if (mark == null) return NotFound();

        _context.Marks.Remove(mark);
        _context.SaveChanges();
        return Ok(new { message = "Mark deleted." });
    }
}
```

---

### Verify It Works

```bash
# POST /api/marks { "studentId": 1, "subject": "Mathematics", "score": 85, "term": "Term 1" }
# GET /api/marks/student/1 → list of marks for student 1
# GET /api/marks → all marks (Principal/Teacher only)
```

---

### Interview Questions

- What is the N+1 problem? How does `Include` solve it?
- When do you use `ThenInclude` vs `Include`?
- What SQL does `_context.Marks.Include(m => m.Student).ThenInclude(s => s.Class)` generate?

---

# BRICK 15 — AchievementsController

**What you're building:** CRUD for school achievements.

---

### Write This

Create `Controllers/AchievementsController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly AppDbContext _context;
    public AchievementsController(AppDbContext context) => _context = context;

    [HttpGet]
    public IActionResult GetAchievements()
    {
        var achievements = _context.Achievements
            .Include(a => a.Student)
            .Select(a => new
            {
                a.Id, a.Title, a.Description, a.ImageUrl, a.IsPublic,
                a.StudentId,
                StudentName = a.Student != null ? a.Student.Name : null
            })
            .OrderByDescending(a => a.Id)
            .ToList();

        return Ok(achievements);
    }

    public class CreateAchievementDto
    {
        public string  Title       { get; set; } = string.Empty;
        public string  Description { get; set; } = string.Empty;
        public string? ImageUrl    { get; set; }
        public bool    IsPublic    { get; set; }
        public int?    StudentId   { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateAchievement([FromBody] CreateAchievementDto dto)
    {
        var achievement = new Achievement
        {
            Title       = dto.Title,
            Description = dto.Description,
            ImageUrl    = dto.ImageUrl,
            IsPublic    = dto.IsPublic,
            StudentId   = dto.StudentId
        };

        _context.Achievements.Add(achievement);
        _context.SaveChanges();
        return Ok(achievement);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal")]
    public IActionResult DeleteAchievement(int id)
    {
        var a = _context.Achievements.Find(id);
        if (a == null) return NotFound();

        _context.Achievements.Remove(a);
        _context.SaveChanges();
        return Ok(new { message = "Achievement deleted." });
    }
}
```

---

# BRICK 16 — Email Service (Interface + Implementation)

**What you're building:** An email service interface with two implementations — one for dev, one for production.

**Concept learned:** Interface + implementation pattern, Dependency Inversion, conditional DI registration.

---

### The Concept

**Why an interface?**
Your controllers depend on `IEmailService`. At test time, swap in a fake. At dev time, use a console logger. In production, use real SMTP. The controller never changes — only the registered implementation changes.

This is the **Dependency Inversion Principle** (the D in SOLID): depend on abstractions, not concretions.

**Conditional registration** — register different implementations based on environment:
```csharp
if (app.Environment.IsDevelopment())
    builder.Services.AddScoped<IEmailService, DevEmailService>();  // prints to console
else
    builder.Services.AddScoped<IEmailService, SmtpEmailService>(); // sends real emails
```

**Primary constructor (C# 12)** — classes with only constructor injection can use this syntax:
```csharp
// Old style
public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    public SmtpEmailService(IConfiguration config) { _config = config; }
}

// C# 12
public class SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger) : IEmailService
{
    // config and logger are available throughout
}
```

---

### Write This

Create folder `MySchool.Api/Services/`.

**`Services/IEmailService.cs`**
```csharp
namespace MySchool.Api.Services;

public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl);
    Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl);
}
```

**`Services/DevEmailService.cs`** — logs to console, no real email
```csharp
namespace MySchool.Api.Services;

public class DevEmailService(ILogger<DevEmailService> logger) : IEmailService
{
    public Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        logger.LogInformation("[DEV EMAIL] Password reset for {Email}: {Url}", toEmail, resetUrl);
        return Task.CompletedTask;
    }

    public Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl)
    {
        logger.LogInformation("[DEV EMAIL] Welcome {Role} {Email} — temp password: {Password}", role, toEmail, tempPassword);
        return Task.CompletedTask;
    }
}
```

**`Services/SmtpEmailService.cs`** — sends real emails via SMTP
```csharp
using System.Net;
using System.Net.Mail;

namespace MySchool.Api.Services;

public class SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        var subject = "Reset your MySchool password";
        var body = $"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
              <h2>MySchool</h2>
              <p>Hi {toName},</p>
              <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
              <a href="{resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Reset Password
              </a>
              <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
            </div>
            """;
        await SendAsync(toEmail, toName, subject, body);
    }

    public async Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl)
    {
        var subject = $"Welcome to MySchool — your {role} account is ready";
        var body = $"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
              <h2>MySchool</h2>
              <p>Welcome, {toName}!</p>
              <p>Your <strong>{role}</strong> account has been created.</p>
              <p>Email: <strong>{toEmail}</strong><br>Password: <strong>{tempPassword}</strong></p>
              <a href="{loginUrl}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Log in to MySchool
              </a>
            </div>
            """;
        await SendAsync(toEmail, toName, subject, body);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var host     = config["Email:SmtpHost"]  ?? throw new InvalidOperationException("Email:SmtpHost not configured.");
        var port     = int.Parse(config["Email:SmtpPort"] ?? "587");
        var from     = config["Email:From"]       ?? throw new InvalidOperationException("Email:From not configured.");
        var password = config["Email:Password"]   ?? throw new InvalidOperationException("Email:Password not configured.");
        var fromName = config["Email:FromName"]   ?? "MySchool";

        using var client = new SmtpClient(host, port)
        {
            EnableSsl   = true,
            Credentials = new NetworkCredential(from, password),
        };

        using var message = new MailMessage
        {
            From       = new MailAddress(from, fromName),
            Subject    = subject,
            Body       = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(new MailAddress(toEmail, toName));

        try
        {
            await client.SendMailAsync(message);
            logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }
}
```

Now register in `Program.cs` — add these two lines **before** `builder.Build()`:

```csharp
// Add after builder.Services.AddControllers():
if (builder.Environment.IsDevelopment())
    builder.Services.AddScoped<IEmailService, DevEmailService>();
else
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
```

---

### Verify It Works

```bash
dotnet build  # should compile
dotnet run
# In Swagger: POST /api/auth/forgot-password { "email": "principal@school.com" }
# Check console — you should see: [DEV EMAIL] Password reset for principal@school.com: http://...
```

---

### Interview Questions

- What is the Dependency Inversion Principle?
- What is the difference between an interface and an abstract class?
- How does swapping implementations work with the DI container?
- What is `builder.Environment.IsDevelopment()` checking?
- What is `Task.CompletedTask` and why do we return it instead of `Task.FromResult(null)`?
- What is `async Task` vs `async Task<T>`?
- What is `async void` and why is it dangerous?

---

# BRICK 17 — DashboardController

**What you're building:** Stats endpoint returning counts and top students.

**Concept learned:** `AsEnumerable()` — switching from SQL to in-memory execution.

---

### The Concept — `AsEnumerable()`

Some operations can't be translated to SQL. `Math.Round` with a specific number of decimal places is one. When you call `AsEnumerable()`, EF loads the data into memory at that point, and all subsequent LINQ runs in C# instead of SQL.

**Warning:** Only use `AsEnumerable()` after filtering as much as possible. If you call it before `.Where()`, you load the entire table into memory first.

```csharp
// BAD — loads ALL students into memory first, then filters
_context.Students.AsEnumerable().Where(s => s.ClassId == 1)

// GOOD — filters in SQL first, then loads into memory for in-memory operations
_context.Students.Where(s => s.ClassId == 1).AsEnumerable().Select(...)
```

---

### Write This

Create `Controllers/DashboardController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    public DashboardController(AppDbContext context) => _context = context;

    [HttpGet("stats")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult GetStats()
    {
        var totalStudents     = _context.Students.Count();
        var totalClasses      = _context.Classes.Count();
        var totalMarks        = _context.Marks.Count();
        var totalAchievements = _context.Achievements.Count();
        var averageScore      = _context.Marks.Any()
            ? Math.Round(_context.Marks.Average(m => (double)m.Score), 1)
            : 0.0;

        // AsEnumerable() needed because Math.Round decimal places can't translate to SQL
        var topStudents = _context.Students
            .Include(s => s.Marks)
            .Include(s => s.Class)
            .Where(s => s.Marks.Any())
            .AsEnumerable()
            .Select(s => new
            {
                s.Id,
                s.Name,
                ClassName = s.Class!.Name,
                Average   = Math.Round(s.Marks.Average(m => (double)m.Score), 1)
            })
            .OrderByDescending(s => s.Average)
            .Take(5)
            .ToList();

        return Ok(new
        {
            totalStudents,
            totalClasses,
            totalMarks,
            totalAchievements,
            averageScore,
            topStudents
        });
    }
}
```

---

### Verify It Works

```bash
# GET /api/dashboard/stats → counts and top 5 students (empty if no data yet)
```

---

### Interview Questions

- What is the difference between `IQueryable<T>` and `IEnumerable<T>`?
- What does `AsEnumerable()` do?  What is the risk of calling it too early?
- Why does `Math.Round(value, 1)` fail to translate to SQL but `Math.Round(value)` does not?

---

# BRICK 18 — UsersController

**What you're building:** User account management (create staff, student, and parent accounts; toggle active; delete).

**Concept learned:** Multiple DTOs, `async/await` with `SaveChangesAsync`, reading caller identity, secure random password generation.

---

### Write This

Create `Controllers/UsersController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MySchool.Api.Data;
using MySchool.Api.Models;
using MySchool.Api.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext  _context;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;

    public UsersController(AppDbContext context, IEmailService email, IConfiguration config)
    {
        _context = context;
        _email   = email;
        _config  = config;
    }

    [HttpGet]
    [Authorize(Roles = "Principal")]
    public IActionResult GetUsers()
    {
        var users = _context.Users
            .Include(u => u.LinkedStudent)
            .OrderBy(u => u.Role).ThenBy(u => u.Name)
            .Select(u => new
            {
                u.Id, u.Name, u.Email, u.Role, u.IsActive, u.CreatedAt,
                u.LinkedStudentId,
                LinkedStudentName = u.LinkedStudent != null ? u.LinkedStudent.Name : null
            })
            .ToList();

        return Ok(users);
    }

    [HttpPost("staff")]
    [Authorize(Roles = "Principal")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Name and email are required." });

        if (_context.Users.Any(u => u.Email == dto.Email))
            return BadRequest(new { message = "An account with that email already exists." });

        var tempPassword = dto.Password ?? GeneratePassword();
        var user = new User
        {
            Name         = dto.Name.Trim(),
            Email        = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role         = "Teacher",
            CreatedAt    = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var loginUrl = _config["Frontend:BaseUrl"] + "/login";
        await _email.SendWelcomeAsync(user.Email, user.Name, "Teacher", tempPassword, loginUrl);

        return Ok(new { message = "Staff account created.", user = new { user.Id, user.Name, user.Email, user.Role }, tempPassword });
    }

    [HttpPost("student-account")]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> CreateStudentAccount([FromBody] CreateLinkedAccountDto dto)
    {
        if (!_context.Students.Any(s => s.Id == dto.StudentId))
            return BadRequest(new { message = "Student not found." });

        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Email is required." });

        if (_context.Users.Any(u => u.Email == dto.Email))
            return BadRequest(new { message = "An account with that email already exists." });

        var student      = _context.Students.Include(s => s.Class).First(s => s.Id == dto.StudentId);
        var tempPassword = dto.Password ?? GeneratePassword();

        var user = new User
        {
            Name            = dto.Name?.Trim() ?? student.Name,
            Email           = dto.Email.Trim().ToLower(),
            PasswordHash    = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role            = "Student",
            LinkedStudentId = dto.StudentId,
            CreatedAt       = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var loginUrl = _config["Frontend:BaseUrl"] + "/login";
        await _email.SendWelcomeAsync(user.Email, user.Name, "Student", tempPassword, loginUrl);

        return Ok(new { message = "Student portal account created.", user = new { user.Id, user.Name, user.Email, user.Role, user.LinkedStudentId }, tempPassword });
    }

    [HttpPost("parent-account")]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> CreateParentAccount([FromBody] CreateLinkedAccountDto dto)
    {
        if (!_context.Students.Any(s => s.Id == dto.StudentId))
            return BadRequest(new { message = "Student not found." });

        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Parent name and email are required." });

        if (_context.Users.Any(u => u.Email == dto.Email))
            return BadRequest(new { message = "An account with that email already exists." });

        var tempPassword = dto.Password ?? GeneratePassword();
        var user = new User
        {
            Name            = dto.Name.Trim(),
            Email           = dto.Email.Trim().ToLower(),
            PasswordHash    = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role            = "Parent",
            LinkedStudentId = dto.StudentId,
            CreatedAt       = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var loginUrl = _config["Frontend:BaseUrl"] + "/login";
        await _email.SendWelcomeAsync(user.Email, user.Name, "Parent", tempPassword, loginUrl);

        return Ok(new { message = "Parent portal account created.", user = new { user.Id, user.Name, user.Email, user.Role, user.LinkedStudentId }, tempPassword });
    }

    [HttpPatch("{id:int}/toggle-active")]
    [Authorize(Roles = "Principal")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var callerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (id == callerId)
            return BadRequest(new { message = "You cannot deactivate your own account." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { user.Id, user.IsActive });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Principal")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var callerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (id == callerId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Account deleted." });
    }

    [HttpGet("unlinked-students")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult GetUnlinkedStudents()
    {
        var linkedIds = _context.Users
            .Where(u => u.LinkedStudentId.HasValue)
            .Select(u => u.LinkedStudentId!.Value)
            .Distinct()
            .ToHashSet();

        var students = _context.Students
            .Include(s => s.Class)
            .OrderBy(s => s.Class.Name).ThenBy(s => s.Name)
            .Select(s => new { s.Id, s.Name, ClassName = s.Class.Name })
            .ToList()
            .Select(s => new { s.Id, s.Name, s.ClassName, hasStudentAccount = linkedIds.Contains(s.Id) });

        return Ok(students);
    }

    private static string GeneratePassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
        var bytes = new byte[10];
        System.Security.Cryptography.RandomNumberGenerator.Create().GetBytes(bytes);
        return new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
    }
}

public class CreateStaffDto
{
    public string  Name     { get; set; } = string.Empty;
    public string  Email    { get; set; } = string.Empty;
    public string? Password { get; set; }
}

public class CreateLinkedAccountDto
{
    public int     StudentId { get; set; }
    public string? Name      { get; set; }
    public string  Email     { get; set; } = string.Empty;
    public string? Password  { get; set; }
}
```

---

### Interview Questions

- What is the difference between `SaveChanges()` and `SaveChangesAsync()`?
- What is `async/await` and why does it matter for web app performance?
- What happens if you call `.Result` on a Task in ASP.NET Core? (deadlock)
- What is `HashSet<T>` and why use it over `List<T>` for the `Contains` check?
- What is `{id:int}` in the route template? What does the `:int` constraint do?

---

# BRICK 19 — AttendanceController

**What you're building:** Attendance recording with bulk save and student-level read.

---

### Write This

Create `Controllers/AttendanceController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;
    public AttendanceController(AppDbContext context) => _context = context;

    [HttpGet]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> GetByClassAndDate([FromQuery] int classId, [FromQuery] DateTime date)
    {
        var day = date.Date;

        var students = await _context.Students
            .Where(s => s.ClassId == classId)
            .OrderBy(s => s.Name)
            .ToListAsync();

        var records = await _context.Attendances
            .Where(a => a.Student.ClassId == classId && a.Date.Date == day)
            .ToListAsync();

        var result = students.Select(s =>
        {
            var rec = records.FirstOrDefault(r => r.StudentId == s.Id);
            return new
            {
                studentId   = s.Id,
                studentName = s.Name,
                status      = rec?.Status ?? "Present",
                notes       = rec?.Notes,
                recordId    = rec?.Id
            };
        });

        return Ok(result);
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> SaveBulk([FromBody] BulkAttendanceRequest req)
    {
        var day = req.Date.Date;

        var classStudentIds = await _context.Students
            .Where(s => s.ClassId == req.ClassId)
            .Select(s => s.Id)
            .ToListAsync();

        var existing = await _context.Attendances
            .Where(a => a.Date.Date == day && classStudentIds.Contains(a.StudentId))
            .ToListAsync();

        _context.Attendances.RemoveRange(existing);

        var newRecords = req.Records.Select(r => new Attendance
        {
            StudentId = r.StudentId,
            Date      = day,
            Status    = r.Status,
            Notes     = r.Notes
        }).ToList();

        _context.Attendances.AddRange(newRecords);
        await _context.SaveChangesAsync();

        return Ok(new { saved = newRecords.Count });
    }

    [HttpGet("student/{studentId:int}")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        var role   = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role is "Student" or "Parent")
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.LinkedStudentId != studentId)
                return Forbid();
        }

        var records = await _context.Attendances
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Date)
            .Select(a => new { a.Id, a.Date, a.Status, a.Notes })
            .ToListAsync();

        return Ok(records);
    }

    [HttpGet("summary")]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> GetSummary([FromQuery] int classId)
    {
        var students = await _context.Students
            .Where(s => s.ClassId == classId)
            .OrderBy(s => s.Name)
            .ToListAsync();

        var studentIds = students.Select(s => s.Id).ToList();

        var allRecords = await _context.Attendances
            .Where(a => studentIds.Contains(a.StudentId))
            .ToListAsync();

        var result = students.Select(s =>
        {
            var recs    = allRecords.Where(r => r.StudentId == s.Id).ToList();
            var total   = recs.Count;
            var present = recs.Count(r => r.Status == "Present");
            var absent  = recs.Count(r => r.Status == "Absent");
            var late    = recs.Count(r => r.Status == "Late");
            var excused = recs.Count(r => r.Status == "Excused");
            return new
            {
                studentId   = s.Id,
                studentName = s.Name,
                total, present, absent, late, excused,
                rate = total > 0 ? Math.Round((double)(present + late) / total * 100, 1) : (double?)null
            };
        });

        return Ok(result);
    }
}

public class BulkAttendanceRequest
{
    public int                   ClassId { get; set; }
    public DateTime              Date    { get; set; }
    public List<AttendanceRecord> Records { get; set; } = [];
}

public class AttendanceRecord
{
    public int     StudentId { get; set; }
    public string  Status    { get; set; } = "Present";
    public string? Notes     { get; set; }
}
```

---

# BRICK 20 — PublicController (No Auth)

**What you're building:** Public-facing endpoints for the school's landing page (no login required).

**Concept learned:** No `[Authorize]` on public controllers, `GroupBy` + `ToDictionary` query pattern.

---

### Write This

Create `Controllers/PublicController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _context;
    public PublicController(AppDbContext context) => _context = context;

    [HttpGet("stats")]
    public IActionResult GetStats() => Ok(new
    {
        students     = _context.Students.Count(),
        classes      = _context.Classes.Count(),
        achievements = _context.Achievements.Count(a => a.IsPublic),
        marks        = _context.Marks.Count(),
    });

    [HttpGet("achievements")]
    public IActionResult GetAchievements()
    {
        var list = _context.Achievements
            .Where(a => a.IsPublic)
            .Include(a => a.Student)
            .OrderByDescending(a => a.Id)
            .Select(a => new
            {
                a.Id, a.Title, a.Description,
                StudentName = a.Student != null ? a.Student.Name : null
            })
            .ToList();

        return Ok(list);
    }

    [HttpGet("classes")]
    public IActionResult GetPublicClasses()
    {
        var enquiryCounts = _context.Enquiries
            .GroupBy(e => e.ClassId)
            .Select(g => new { ClassId = g.Key, Count = g.Count() })
            .ToDictionary(x => x.ClassId, x => x.Count);

        var classes = _context.Classes
            .Include(c => c.Students)
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Name, Capacity = 40, Occupied = c.Students.Count, Available = 40 - c.Students.Count })
            .ToList()
            .Select(c => new { c.Id, c.Name, c.Capacity, c.Occupied, c.Available, Enquiries = enquiryCounts.GetValueOrDefault(c.Id, 0) });

        return Ok(classes);
    }

    [HttpPost("enquiry")]
    public IActionResult SubmitEnquiry([FromBody] EnquiryDto dto)
    {
        if (!_context.Classes.Any(c => c.Id == dto.ClassId))
            return BadRequest(new { message = "Class not found." });

        if (string.IsNullOrWhiteSpace(dto.ParentName) || string.IsNullOrWhiteSpace(dto.ParentEmail) || string.IsNullOrWhiteSpace(dto.StudentName))
            return BadRequest(new { message = "Name, email, and student name are required." });

        var enquiry = new Enquiry
        {
            ClassId     = dto.ClassId,
            ParentName  = dto.ParentName.Trim(),
            ParentEmail = dto.ParentEmail.Trim(),
            StudentName = dto.StudentName.Trim(),
            Message     = dto.Message?.Trim(),
            CreatedAt   = DateTime.UtcNow
        };

        _context.Enquiries.Add(enquiry);
        _context.SaveChanges();

        return Ok(new { message = "Enquiry submitted successfully." });
    }
}

public class EnquiryDto
{
    public int     ClassId     { get; set; }
    public string  ParentName  { get; set; } = string.Empty;
    public string  ParentEmail { get; set; } = string.Empty;
    public string  StudentName { get; set; } = string.Empty;
    public string? Message     { get; set; }
}
```

---

### Interview Questions

- What SQL does `GroupBy(...).Select(g => new { ..., Count = g.Count() })` generate?
- What is `ToDictionary()` and why is it used here instead of a second database query?
- What is `GetValueOrDefault(key, defaultValue)` doing?

---

# BRICK 21 — DevSeeder (Rich Demo Data)

**What you're building:** Automatic seeding of 100 students, marks, attendance, and achievements in Development mode.

**Concept learned:** Startup seeding pattern, idempotency, `AddRange` for bulk insert.

---

### The Concept

A **seeder** populates the database with realistic data so the UI looks real during development. Key rules:
1. **Idempotent** — check if data exists before inserting (`if (db.Students.Any()) return;`)
2. **Development only** — never seed in production
3. **Deterministic** — use `new Random(42)` (a fixed seed) so the same data is generated every time

`db.Marks.AddRange(marks)` + one `db.SaveChanges()` is far more efficient than looping and calling `SaveChanges` for each record — it batches into fewer SQL statements.

---

### Write This

Create `Services/DevSeeder.cs` — copy it from the app. It's long but mechanical — the key pattern is what matters:

```csharp
using MySchool.Api.Data;
using MySchool.Api.Models;

namespace MySchool.Api.Services;

public class DevSeeder(AppDbContext db, ILogger<DevSeeder> logger)
{
    public void SeedIfEmpty()
    {
        if (db.Students.Any()) return;  // idempotent guard

        logger.LogInformation("Dev seed: starting...");

        var rng      = new Random(42);  // fixed seed = same data every time
        var password = BCrypt.Net.BCrypt.HashPassword("School@2024");

        // ── Classes ────────────────────────────────────────────────────────
        var classes = Enumerable.Range(1, 10)
            .Select(i => new Class { Name = $"Class {i}" }).ToList();
        db.Classes.AddRange(classes);
        db.SaveChanges();

        // ── Students + Marks ───────────────────────────────────────────────
        string[] studentNames = [ "Ahmed Hassan", "Sara Ali", "Mohammed Khalid", "Fatima Sheikh",
            "Omar Abdullah", "Zainab Rahman", "Ali Hassan", "Maryam Hussain",
            /* add more names here — 100 total, see the original DevSeeder.cs */ ];

        static string[] SubjectsFor(int classNum) => classNum switch
        {
            <= 3 => ["Mathematics", "English Language", "Science", "Arabic", "Art"],
            <= 6 => ["Mathematics", "English Language", "Science", "Arabic", "Social Studies", "Islamic Studies"],
            <= 9 => ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Arabic", "History", "Geography"],
            _    => ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Arabic", "History", "Computer Science"]
        };

        string[] terms = ["Term 1", "Term 2", "Term 3"];
        var students = new List<Student>();
        var marks    = new List<Mark>();

        for (int i = 0; i < studentNames.Length; i++)
        {
            int classNum = (i / 10) + 1;
            int classId  = classes[classNum - 1].Id;
            int tier     = i % 10 < 2 ? 0 : i % 10 < 8 ? 1 : 2; // struggling / average / high

            var student = new Student { Name = studentNames[i], ClassId = classId };
            db.Students.Add(student);
            db.SaveChanges();
            students.Add(student);

            foreach (var term in terms)
                foreach (var subject in SubjectsFor(classNum))
                {
                    int score = tier switch
                    {
                        0 => rng.Next(35, 62),
                        2 => rng.Next(80, 99),
                        _ => rng.Next(58, 86),
                    };
                    marks.Add(new Mark
                    {
                        StudentId = student.Id,
                        Subject   = subject,
                        Score     = Math.Clamp(score + rng.Next(-5, 6), 0, 100),
                        Term      = term
                    });
                }
        }

        db.Marks.AddRange(marks);  // bulk insert — one SaveChanges for all marks
        db.SaveChanges();

        logger.LogInformation("Dev seed complete — {Students} students, {Marks} marks", students.Count, marks.Count);
    }
}
```

> Tip: Copy the full `studentNames` array (100 names) from `Services/DevSeeder.cs` in the original app.

Now register and call in `Program.cs` — add before `builder.Build()`:

```csharp
builder.Services.AddScoped<DevSeeder>();
```

And after the bootstrap block:

```csharp
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<DevSeeder>().SeedIfEmpty();
}
```

---

### Verify It Works

```bash
dotnet run
# Console: Dev seed complete — 100 students, XXXX marks
# GET /api/students → 100 students
# GET /api/dashboard/stats → real numbers
```

---

### Interview Questions

- What is `AddRange` vs `Add` in terms of performance? What SQL does each generate?
- What does `new Random(42)` do — why is 42 chosen?
- What is a switch expression (`=>`) in C# and how is it different from a switch statement?
- What is `Math.Clamp(value, min, max)`?
- Why do we seed only in Development and not in Production?

---

# Final State: Complete Program.cs

After all bricks, your `Program.cs` should look like this:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MySchool.Api.Data;
using MySchool.Api.Models;
using MySchool.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Email ─────────────────────────────────────────────────────────────────
if (builder.Environment.IsDevelopment())
    builder.Services.AddScoped<IEmailService, DevEmailService>();
else
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();

builder.Services.AddScoped<DevSeeder>();
builder.Services.AddControllers();

// ── JWT Authentication ─────────────────────────────────────────────────────
var key = Encoding.UTF8.GetBytes(
    builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured."));

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

// ── Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MySchool API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http,
        Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
        Array.Empty<string>()
    }});
});

var app = builder.Build();

// ── Startup: migrate + bootstrap Principal ────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    db.Database.Migrate();

    if (!db.Users.Any())
    {
        db.Users.Add(new User
        {
            Name         = config["Bootstrap:PrincipalName"]     ?? "School Principal",
            Email        = config["Bootstrap:PrincipalEmail"]    ?? "principal@school.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(config["Bootstrap:PrincipalPassword"] ?? "School@2024"),
            Role         = "Principal",
            CreatedAt    = DateTime.UtcNow,
        });
        db.SaveChanges();
        logger.LogInformation("Bootstrap: Principal created");
    }
}

// ── Dev seed ──────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<DevSeeder>().SeedIfEmpty();
}

// ── Middleware pipeline ────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
```

---

# Backend Complete — What You've Built

```
MySchool.Api/
├── Program.cs                    ← startup, DI, middleware pipeline
├── appsettings.json              ← configuration
├── MySchool.Api.csproj           ← packages with exact versions
├── Data/
│   └── AppDbContext.cs           ← EF Core context, relationships
├── Models/
│   ├── Class.cs
│   ├── Student.cs
│   ├── Mark.cs
│   ├── Achievement.cs
│   ├── Attendance.cs
│   ├── User.cs
│   └── Enquiry.cs
├── Migrations/
│   └── 20xxxxxx_InitialCreate.cs ← auto-generated schema
├── Controllers/
│   ├── AuthController.cs         ← login, signup, password reset
│   ├── ClassesController.cs      ← CRUD, Principal only for write
│   ├── StudentsController.cs     ← CRUD, resource-based auth
│   ├── MarksController.cs        ← CRUD, resource-based auth
│   ├── AchievementsController.cs ← CRUD
│   ├── DashboardController.cs    ← stats
│   ├── UsersController.cs        ← account management
│   ├── AttendanceController.cs   ← attendance with bulk save
│   └── PublicController.cs       ← no auth, public landing page
└── Services/
    ├── IEmailService.cs          ← interface
    ├── SmtpEmailService.cs       ← production implementation
    ├── DevEmailService.cs        ← dev implementation (console)
    └── DevSeeder.cs              ← dev data seeder
```

---

# Up Next: PART 2 — Frontend (React 18 + TypeScript + Vite)

Topics will be added as bricks:
- Brick 22: Vite project setup, TypeScript config, folder structure
- Brick 23: Axios API client with JWT interceptor + 401 auto-redirect
- Brick 24: Auth utilities (getUser, getRole, logout)
- Brick 25: React Router v6 — routes, navigation, protected routes
- Brick 26: Layout component — sidebar with role-based menu
- Brick 27: Login page — form handling, controlled inputs, JWT storage
- Brick 28: Dashboard page — data fetching with useEffect
- Brick 29: Students page — list, search, add/edit/delete modals
- Brick 30: Classes page
- Brick 31: Marks page
- Brick 32: My Marks page (Student role)
- Brick 33: My Child page (Parent role)
- Brick 34: Achievements page
- Brick 35: CSS design system — variables, dark sidebar, card components

---

*Last updated: April 2026*
