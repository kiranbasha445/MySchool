# MySchool — Build From Scratch: Learning Guide

> **Goal:** Rebuild the MySchool app manually, concept by concept, so you own every line.
> Each section = one concept = one thing to build. Backend first, UI second.
> Read the concept, understand it, then write the code yourself without copy-pasting.

---

## How to Use This Guide

1. Read the concept explanation
2. Look at the "In Our App" code reference
3. **Write it yourself** from scratch
4. Check the "Interview Questions" at the end of each section — these are real questions

---

# PART 1 — BACKEND (ASP.NET Core 8 + EF Core + PostgreSQL)

---

## Step 1 — Project Setup & Solution Structure

### What to build
```bash
dotnet new sln -n MySchool
dotnet new webapi -n MySchool.Api --no-openapi
dotnet sln add MySchool.Api
```

### What just happened

**Solution file (`.sln`)** — A container that groups one or more projects. Visual Studio/Rider uses it to open everything at once. The CLI uses it to build all projects together. It does not contain code.

**Project file (`.csproj`)** — The actual project. Defines:
- Target framework (`<TargetFramework>net8.0</TargetFramework>`)
- NuGet package references
- Build settings

**`--no-openapi`** — We add Swagger ourselves later so we understand what we're registering.

### The new minimal hosting model (`Program.cs`)

Before .NET 6 you had two files: `Startup.cs` + `Program.cs`. Now it's one file using **top-level statements** (C# 9+) — the compiler generates the class and Main method for you.

```csharp
var builder = WebApplication.CreateBuilder(args);  // Phase 1: register services
// ... add services to builder.Services

var app = builder.Build();                          // Phase 2: configure pipeline
// ... add middleware

app.Run();
```

**Phase 1 (builder)** = "what does this app know how to do?" — builds the DI container.
**Phase 2 (app)** = "what does every HTTP request pass through?" — the middleware pipeline.

`builder.Build()` is the dividing line. You **cannot** add services after it.

### NuGet packages you will need (add as you go)
```bash
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package Swashbuckle.AspNetCore
```

### Interview Questions
- What is the difference between a `.sln` and a `.csproj` file?
- What did the Minimal Hosting Model replace and why was it introduced?
- What does `builder.Build()` do and why can't you add services after it?
- What are top-level statements in C#?

---

## Step 2 — Dependency Injection (DI)

### What it is

**Dependency Injection** means: instead of a class creating its own dependencies with `new`, it *declares* what it needs and the framework *provides* them.

Without DI:
```csharp
public class StudentsController
{
    private AppDbContext _context = new AppDbContext(...); // tightly coupled, hard to test
}
```

With DI:
```csharp
public class StudentsController
{
    private readonly AppDbContext _context;
    public StudentsController(AppDbContext context) => _context = context; // injected
}
```

The controller doesn't know where `AppDbContext` comes from — the DI container creates it and hands it in.

### Three lifetimes — the most important concept in DI

| Lifetime | Method | Created | Destroyed | Use for |
|----------|--------|---------|-----------|---------|
| **Singleton** | `AddSingleton` | Once, app start | App shutdown | Caches, config helpers, shared state |
| **Scoped** | `AddScoped` | Once per HTTP request | End of request | DbContext, unit of work |
| **Transient** | `AddTransient` | Every time it's asked for | When caller is disposed | Lightweight, stateless services |

### Why DbContext must be Scoped, not Singleton

`DbContext` tracks entity changes in memory (change tracker). If it were Singleton, all requests would share the same tracker — corrupted state, cross-request data leaks. Scoped = one per request = safe.

### In Our App

```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IEmailService, SmtpEmailService>(); // interface → implementation
builder.Services.AddScoped<DevSeeder>();
```

```csharp
// StudentsController.cs — constructor injection
public StudentsController(AppDbContext context) => _context = context;

// UsersController.cs — multiple dependencies
public UsersController(AppDbContext context, IEmailService email, IConfiguration config)
{
    _context = context;
    _email   = email;
    _config  = config;
}
```

### The scope problem at startup

`AppDbContext` is Scoped — it needs an HTTP request context to live in. At startup, there's no request. So when you need DbContext at startup (to run migrations), you **manually create a scope**:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
```

This is a classic interview trap. Injecting a scoped service into a Singleton causes a runtime error: **"Cannot consume scoped service from singleton"**.

### Interview Questions
- What are the three DI lifetimes and when do you use each?
- Why is DbContext registered as Scoped and not Singleton?
- What happens if you inject a Scoped service into a Singleton?
- What is constructor injection vs property injection?
- Why do we call `CreateScope()` at startup instead of just using `app.Services.GetService<AppDbContext>()`?

---

## Step 3 — EF Core: Models (Entities)

### What they are

**Models** (also called **entities**) are plain C# classes that represent database tables. EF Core uses them to generate SQL.

### Convention over configuration

EF Core follows conventions by default:
- Property named `Id` or `ClassNameId` → becomes the **primary key** (auto-increment int)
- A property of type `string` → `nvarchar(max)` / `text` in the DB
- A property ending in `Id` that matches a navigation property → **foreign key**
- `?` (nullable) → allows NULL in the DB

### In Our App

```csharp
// Models/Class.cs
public class Class
{
    public int Id { get; set; }          // PK — convention
    public string Name { get; set; } = string.Empty;

    public List<Student> Students { get; set; } = []; // navigation property
}
```

```csharp
// Models/Student.cs
public class Student
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ProfileImage { get; set; }  // nullable — optional

    public int ClassId { get; set; }           // FK — convention (matches Class.Id)
    public Class Class { get; set; } = null!;  // navigation property

    public List<Mark> Marks { get; set; } = [];
    public List<Achievement> Achievements { get; set; } = [];
}
```

```csharp
// Models/Mark.cs
public class Mark
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? Term { get; set; }

    public int StudentId { get; set; }         // FK
    public Student Student { get; set; } = null!;
}
```

```csharp
// Models/User.cs
public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    public int? LinkedStudentId { get; set; }  // nullable FK
    public Student? LinkedStudent { get; set; } // nullable nav property
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
```

### `= null!` vs `= string.Empty`

- `= string.Empty` — for required strings, prevents null warnings, column is NOT NULL
- `= null!` — navigation properties you promise EF Core will populate (the `!` silences the nullable warning — you're saying "trust me, EF will fill this")
- `string?` — truly optional (nullable), maps to NULL in DB

### Interview Questions
- What is a navigation property?
- How does EF Core know which property is the primary key?
- How does EF Core know which property is a foreign key without you telling it?
- What is the difference between `string?` and `string` in an EF Core model?
- What does `= null!` mean and when do you use it?

---

## Step 4 — EF Core: DbContext

### What it is

`DbContext` is EF Core's main class — it's the **bridge between your C# objects and the database**. It:
- Holds the connection to the database
- Tracks which entities have changed (**change tracker**)
- Translates LINQ to SQL
- Manages transactions

### In Our App

```csharp
// Data/AppDbContext.cs
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
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Achievement>()
            .HasOne(a => a.Student)
            .WithMany(s => s.Achievements)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
```

### Primary constructor syntax (C# 12)

```csharp
// Old style:
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}

// New C# 12 primary constructor — identical result, less code:
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
```

### DbSet<T>

Each `DbSet<T>` property represents a **database table**. You query through it:
- `_context.Users` → Users table
- `_context.Students.Where(...)` → SELECT from Students WHERE ...

### Interview Questions
- What is the EF Core change tracker?
- What is the difference between `DbContext` and `DbSet<T>`?
- When you call `_context.SaveChanges()`, what SQL does EF Core generate?
- What is `OnModelCreating` and when do you use it vs data annotations?
- What does calling `_context.Students.Add(student)` actually do? (Hint: it doesn't touch the DB yet)

---

## Step 5 — EF Core: Relationships

### Types of relationships

| Type | Example | How defined |
|------|---------|-------------|
| One-to-Many | One Class has many Students | FK on the "many" side |
| Many-to-One | Many Students belong to one Class | Same as above, different perspective |
| One-to-One | One User linked to one Student | FK + unique index |
| Many-to-Many | Students ↔ Subjects | Join table |

### In Our App: One-to-Many (Class → Students)

```csharp
// Class has many Students
public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Student> Students { get; set; } = [];  // collection nav property
}

// Student belongs to one Class
public class Student
{
    public int ClassId { get; set; }           // FK property
    public Class Class { get; set; } = null!;  // reference nav property
}
```

EF Core sees `ClassId` + `Class` navigation property on `Student` → automatically configures a FK constraint `FK_Students_Classes_ClassId`.

### Cascade Delete behaviors

When you delete a `Class`, what happens to its `Students`?

| Behavior | What happens |
|----------|-------------|
| `Cascade` | Delete the Students too (default for required FKs) |
| `SetNull` | Set the FK to NULL (only if FK is nullable) |
| `Restrict` | Throw an error if child records exist |
| `NoAction` | Do nothing in EF, let DB decide |

In Our App — `Achievement.StudentId` is nullable (`int?`). When a Student is deleted, we want to keep the achievement but remove the link:

```csharp
// AppDbContext.cs — OnModelCreating
modelBuilder.Entity<Achievement>()
    .HasOne(a => a.Student)        // Achievement has one Student
    .WithMany(s => s.Achievements) // Student has many Achievements
    .HasForeignKey(a => a.StudentId)
    .OnDelete(DeleteBehavior.SetNull); // Student deleted → StudentId becomes NULL
```

Other relationships use the EF Core convention cascade (FK required → Cascade by default).

### Interview Questions
- What is a navigation property and what are the two kinds?
- What is a foreign key property and why do you need both it AND the navigation property?
- What is `DeleteBehavior.Cascade` and when would you choose `SetNull` instead?
- What happens if you don't call `.HasForeignKey()` in the Fluent API — does the relationship still work?
- What is the difference between configuring relationships with Fluent API vs data annotations?

---

## Step 6 — EF Core: Migrations

### What they are

When your C# models change, your database schema needs to change too. **Migrations** are auto-generated C# files that track those schema changes and can apply them to the DB.

Think of them as **version control for your database schema**.

### The workflow

```bash
# 1. After changing a model, create a migration
dotnet ef migrations add InitialCreate --project MySchool.Api

# 2. Apply the migration to the database
dotnet ef database update --project MySchool.Api
```

### What gets generated

Two files in the `Migrations/` folder:
- `20260422172028_InitialCreate.cs` — the migration with `Up()` and `Down()` methods
- `AppDbContextModelSnapshot.cs` — snapshot of the current model state (EF uses this to calculate what changed next time)

```csharp
// The Up() method — what to do when migrating forward
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.CreateTable(
        name: "Classes",
        columns: table => new
        {
            Id = table.Column<int>(nullable: false)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            Name = table.Column<string>(nullable: false)
        },
        constraints: table => { table.PrimaryKey("PK_Classes", x => x.Id); });
    // ... more tables
}

// The Down() method — how to UNDO this migration
protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropTable(name: "Classes");
    // ... in reverse order
}
```

### Auto-migrate on startup

Our app runs migrations automatically when it starts. This is great for deployment — you never have to manually run `dotnet ef database update` on the server:

```csharp
// Program.cs — after builder.Build()
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // applies all pending migrations
}
```

**Important:** `db.Database.Migrate()` is safe to run repeatedly — it only applies migrations that haven't been applied yet. EF tracks this in the `__EFMigrationsHistory` table in your database.

### Interview Questions
- What is the difference between `db.Database.Migrate()` and `db.Database.EnsureCreated()`?
- What is the `__EFMigrationsHistory` table and what does EF Core store in it?
- What is the `ModelSnapshot` file and why must it never be manually edited?
- If two developers add migrations simultaneously on different branches, what problem occurs and how do you fix it?
- What does `Down()` do and when would you ever call it?

---

## Step 7 — Configuration (`appsettings.json`)

### What it is

`appsettings.json` stores configuration that changes per environment (connection strings, API keys, feature flags). You never hardcode these in code.

### File hierarchy

```
appsettings.json          ← base settings (committed to git)
appsettings.Development.json  ← overrides for local dev
appsettings.Production.json   ← overrides for production (usually empty, use env vars)
```

The environment-specific file **overrides** the base file for matching keys.

### In Our App

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=MySchoolDb;Username=myschool;Password=devpass"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters-long"
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
    "Password": "your-email-password",
    "FromName": "MySchool"
  }
}
```

### Reading configuration in code

```csharp
// In Program.cs — reading nested keys
var key = builder.Configuration["Jwt:Key"];               // colon = nesting
var connStr = builder.Configuration.GetConnectionString("DefaultConnection"); // shortcut

// In a controller — via IConfiguration injected
public AuthController(IConfiguration config)
{
    var key = config["Jwt:Key"];
    var frontendUrl = config["Frontend:BaseUrl"] ?? "http://localhost:5173";
}
```

### Secrets in production

**Never** put real passwords/keys in `appsettings.json` in git. Use:
- **Environment variables** — `ConnectionStrings__DefaultConnection=...` (double underscore = colon)
- **Docker secrets** / **Kubernetes secrets**
- **Azure Key Vault** / **AWS Secrets Manager**

### Interview Questions
- What is the difference between `appsettings.json` and `appsettings.Development.json`?
- How does ASP.NET Core decide which environment it's running in?
- How do you override a nested config value using an environment variable?
- What is the `IConfiguration` interface and how do you get a typed section from it using `GetSection<T>()`?
- Why should secrets never be in `appsettings.json` that's committed to git?

---

## Step 8 — CORS (Cross-Origin Resource Sharing)

### What it is

**CORS** is a browser security feature. When your React app (at `localhost:5173`) calls your API (at `localhost:5000`), the browser blocks it because the ports differ = different "origins".

The server must explicitly tell browsers: "I allow requests from this origin."

CORS only affects **browser-to-server** requests. Tools like Postman, curl, and server-to-server calls are never blocked by CORS.

### In Our App

```csharp
// Program.cs — register CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()    // allow all origins (fine for dev/internal apps)
              .AllowAnyMethod()    // GET, POST, PUT, DELETE, etc.
              .AllowAnyHeader());  // Content-Type, Authorization, etc.
});

// ... later in the middleware pipeline
app.UseCors();  // must be before UseAuthentication
```

### For production you'd restrict origins

```csharp
options.AddDefaultPolicy(policy =>
    policy.WithOrigins("https://myschool.com", "https://app.myschool.com")
          .AllowAnyMethod()
          .AllowAnyHeader());
```

### Why CORS must come before authentication in the pipeline

When a browser makes a cross-origin request with an `Authorization` header, it first sends a **preflight OPTIONS request**. If CORS middleware isn't first, the preflight gets rejected before authentication can even process it.

### Interview Questions
- What is CORS and why does it exist?
- What is a CORS preflight request? When does the browser send one?
- What is the difference between `AllowAnyOrigin()` and `WithOrigins(...)`?
- Does CORS protect the server? (No — it protects users. Explain why.)
- Why must `UseCors()` come before `UseAuthentication()` in the pipeline?

---

## Step 9 — Controllers & Routing

### What a controller is

A controller is a class that handles HTTP requests. In ASP.NET Core Web API:
- It inherits from `ControllerBase` (not `Controller` — that's MVC with views)
- Decorated with `[ApiController]` for automatic behavior (model validation, 400 responses, etc.)
- Decorated with `[Route("api/[controller]")]` to define the base URL path

### `[ApiController]` does these things automatically

1. **Model binding** — reads JSON body, query params, route values automatically
2. **Validation** — if model validation fails → automatic 400 Bad Request
3. **[FromBody] inference** — complex types are automatically assumed to be from the body

### Route templates

```csharp
[Route("api/[controller]")]  // [controller] = class name minus "Controller"
                              // ClassesController → /api/classes
public class ClassesController : ControllerBase
{
    [HttpGet]           // GET /api/classes
    [HttpGet("{id}")]   // GET /api/classes/5  (id comes from the URL)
    [HttpPost]          // POST /api/classes
    [HttpPut("{id}")]   // PUT /api/classes/5
    [HttpDelete("{id}")] // DELETE /api/classes/5
    [HttpPatch("{id:int}/toggle-active")] // PATCH /api/users/5/toggle-active
}
```

### In Our App

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _context;
    public StudentsController(AppDbContext context) => _context = context;

    [HttpGet]
    public IActionResult GetStudents() { ... return Ok(students); }

    [HttpGet("{id}")]
    public IActionResult GetStudent(int id) { ... return NotFound(); }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateStudent([FromBody] CreateStudentDto dto) { ... }

    [HttpPut("{id}")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult UpdateStudent(int id, [FromBody] CreateStudentDto dto) { ... }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal")]
    public IActionResult DeleteStudent(int id) { ... }
}
```

### IActionResult return types

| Method | HTTP Status | When to use |
|--------|-------------|-------------|
| `Ok(data)` | 200 | Success with data |
| `Ok()` | 200 | Success, no data |
| `Created(...)` | 201 | Resource created |
| `NotFound()` | 404 | Resource doesn't exist |
| `BadRequest(obj)` | 400 | Invalid input |
| `Unauthorized()` | 401 | Not authenticated |
| `Forbid()` | 403 | Authenticated but not allowed |
| `NoContent()` | 204 | Success, no content to return |

### Interview Questions
- What is the difference between `Controller` and `ControllerBase`?
- What does `[ApiController]` automatically do for you?
- What is the difference between `[FromBody]`, `[FromRoute]`, and `[FromQuery]`?
- What is the difference between `Unauthorized()` (401) and `Forbid()` (403)?
- How does `[controller]` in the route template get resolved?
- What is content negotiation in ASP.NET Core?

---

## Step 10 — DTOs (Data Transfer Objects)

### What they are

A **DTO** is a simple class used to carry data between the client and the API. You never expose your EF Core entities directly in API responses/requests.

### Why not expose entities directly?

1. **Security** — Entity has `PasswordHash`, `ResetToken`. You don't want those in responses.
2. **Circular references** — `Student` has `List<Mark>`, `Mark` has `Student` → infinite JSON loop
3. **Over-posting attack** — Client sends `{ "Role": "Principal" }` in a signup request and you blindly bind it to a `User` entity → privilege escalation
4. **Decoupling** — Your DB schema and your API contract can evolve independently

### In Our App

```csharp
// AuthController.cs — inner DTO classes
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class SignupDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    public int? LinkedStudentId { get; set; }
}
```

### Anonymous projections (inline DTOs)

For read operations, we use LINQ `Select` to project only what we need:

```csharp
// StudentsController.cs
var students = _context.Students
    .Include(s => s.Class)
    .Include(s => s.Marks)
    .Select(s => new   // anonymous type = inline DTO
    {
        s.Id,
        s.Name,
        s.ClassId,
        ClassName = s.Class.Name,       // only what the client needs
        AverageScore = s.Marks.Any() ? Math.Round(s.Marks.Average(m => m.Score), 1) : (double?)null
        // PasswordHash, ResetToken etc. are NOT included
    })
    .ToList();
```

### Interview Questions
- What is an over-posting attack and how do DTOs prevent it?
- What is the difference between a DTO and a ViewModel?
- Why can serializing EF Core entities directly cause a `JsonException`?
- When would you use a separate DTO class vs an anonymous projection in `Select()`?
- What is AutoMapper and when would you use it?

---

## Step 11 — EF Core: Querying

### The basics

EF Core queries are **LINQ to SQL** — you write C# and EF translates to SQL.

Key principle: **the query doesn't run until you call a "terminal" method** like `.ToList()`, `.FirstOrDefault()`, `.Any()`, `.Count()`. Before that, it's just an expression tree.

### Eager Loading with `Include` / `ThenInclude`

By default EF Core does **lazy loading** (disabled in our app) or **no loading** of navigation properties. To load related data, use `Include`:

```csharp
// Load Student WITH its Class and Marks in one query
var students = _context.Students
    .Include(s => s.Class)       // LEFT JOIN Classes
    .Include(s => s.Marks)       // LEFT JOIN Marks
    .ToList();

// ThenInclude — go deeper (Student → Marks → nothing here, but...)
var marks = _context.Marks
    .Include(m => m.Student)
    .ThenInclude(s => s.Class)   // Student's Class (2 levels deep)
    .ToList();
```

Without `Include`, navigation properties are `null` at runtime.

### Projection with `Select`

`Select` transforms each entity into something else (a DTO, anonymous type, or primitive):

```csharp
// Returns only the fields we need — EF generates a SELECT with only those columns
var classes = _context.Classes
    .Include(c => c.Students)
    .Select(c => new { c.Id, c.Name, StudentCount = c.Students.Count })
    .ToList();
```

**Important:** When you use `Select`, you often don't need `Include` — EF is smart enough to generate the JOIN when you reference navigation properties inside `Select`.

### `AsEnumerable()` — switch from SQL to in-memory

```csharp
// DashboardController.cs
var topStudents = _context.Students
    .Include(s => s.Marks)
    .Include(s => s.Class)
    .Where(s => s.Marks.Any())
    .AsEnumerable()              // ← everything after this runs IN MEMORY (C#)
    .Select(s => new
    {
        Average = Math.Round(s.Marks.Average(m => (double)m.Score), 1)  // Math.Round can't translate to SQL
    })
    .OrderByDescending(s => s.Average)
    .Take(5)
    .ToList();
```

Without `AsEnumerable()`, EF would try to translate `Math.Round` to SQL and fail. You switch to in-memory when the operation can't be expressed in SQL.

### Common LINQ methods

```csharp
_context.Students.ToList()                       // execute, get all
_context.Students.FirstOrDefault(s => s.Id == id) // SELECT TOP 1 WHERE, or null
_context.Students.Find(id)                       // looks in cache first, then DB
_context.Students.Any(s => s.Email == email)     // SELECT CASE WHEN EXISTS(...)
_context.Students.Count()                        // SELECT COUNT(*)
_context.Students.Where(s => s.ClassId == 1)     // WHERE
_context.Students.OrderBy(s => s.Name)           // ORDER BY
_context.Students.OrderByDescending(s => s.Name) // ORDER BY DESC
_context.Students.Take(5)                        // TOP 5
_context.Students.Skip(10).Take(5)              // OFFSET 10 FETCH NEXT 5 (pagination)
```

### Interview Questions
- What is the difference between `Include` and `ThenInclude`?
- What is lazy loading vs eager loading in EF Core?
- What does `AsEnumerable()` do and why would you use it?
- What is the N+1 problem in EF Core and how does `Include` solve it?
- What is the difference between `Find(id)` and `FirstOrDefault(s => s.Id == id)`?
- When does EF Core actually execute the SQL?

---

## Step 12 — Password Hashing with BCrypt

### Why you never store plain passwords

If your database is breached and passwords are stored as plaintext (or even MD5/SHA1), every user's password is exposed. **Password hashing** means you store an irreversible hash — even if breached, attackers can't recover the original password easily.

### How BCrypt works

BCrypt is a **slow hashing algorithm** designed specifically for passwords. "Slow" is intentional — it makes brute-force attacks impractical.

It automatically generates a **salt** (random data mixed into the hash before hashing). This means two users with the same password get different hashes.

```csharp
// Hashing (at signup/password change)
string hash = BCrypt.Net.BCrypt.HashPassword("MyPassword123");
// Result: "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
// The $11$ is the "work factor" — how many rounds to compute

// Verifying (at login)
bool isValid = BCrypt.Net.BCrypt.Verify("MyPassword123", hash); // true
bool isValid = BCrypt.Net.BCrypt.Verify("WrongPassword", hash);  // false
```

### In Our App

```csharp
// AuthController.cs — Signup
user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

// AuthController.cs — Login
if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
    return Unauthorized(new { message = "Invalid email or password." });
```

### Interview Questions
- What is the difference between hashing and encryption?
- What is a salt and why does BCrypt generate one automatically?
- What is a work factor (cost factor) in BCrypt and what happens if you increase it?
- Why are MD5 and SHA256 not suitable for password hashing?
- Why does `BCrypt.Verify` need the hash — where is the salt stored?

---

## Step 13 — JWT Authentication

### What JWT is

**JSON Web Token** — a compact, self-contained token that proves who a user is. Format: `header.payload.signature` (base64 encoded, dot-separated).

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.   ← header
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.  ← payload (claims)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← signature
```

The **signature** is what makes it trustworthy. Only the server that knows the secret key can produce a valid signature. The browser can't fake one.

### Claims

The **payload** contains **claims** — key-value pairs that describe the user:

```json
{
  "sub": "42",              // NameIdentifier — user ID
  "unique_name": "admin@school.com",  // Name — email
  "given_name": "Admin",   // GivenName — display name
  "role": "Principal",      // Role — for authorization
  "exp": 1716239022         // Expires at (Unix timestamp)
}
```

### In Our App — Generating a token

```csharp
// AuthController.cs — Login endpoint
var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);

var tokenDescriptor = new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(
    [
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Email),
        new Claim(ClaimTypes.GivenName, user.Name),
        new Claim(ClaimTypes.Role, user.Role)
    ]),
    Expires = DateTime.UtcNow.AddHours(8),
    SigningCredentials = new SigningCredentials(
        new SymmetricSecurityKey(key),
        SecurityAlgorithms.HmacSha256Signature)
};

var tokenHandler = new JwtSecurityTokenHandler();
var token = tokenHandler.CreateToken(tokenDescriptor);
return Ok(new { token = tokenHandler.WriteToken(token) });
```

### In Our App — Validating tokens (Program.cs)

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = false,  // not checking who issued it
        ValidateAudience         = false,  // not checking who it's for
        ValidateIssuerSigningKey = true,   // YES — verify the signature
        IssuerSigningKey         = new SymmetricSecurityKey(key)
    };
});
```

Every request with `Authorization: Bearer <token>` is automatically validated. If valid, `HttpContext.User` is populated with the claims.

### How it flows end-to-end

```
1. POST /api/auth/login  { email, password }
2. Server verifies password, creates JWT with claims, returns it
3. Client stores JWT (localStorage or memory)
4. Client sends JWT in every request: Authorization: Bearer <token>
5. Server's JWT middleware validates signature, sets HttpContext.User
6. [Authorize] checks HttpContext.User — if empty → 401
```

### Interview Questions
- What are the three parts of a JWT?
- What is the difference between authentication and authorization?
- Why can't a client tamper with JWT claims?
- What is the difference between symmetric (HMAC) and asymmetric (RSA) JWT signing?
- What are the downsides of JWT compared to server-side sessions?
- Why do JWTs have an expiry (`exp` claim)? How do you handle token refresh?
- What is the difference between `ValidateIssuer` and `ValidateAudience`?

---

## Step 14 — Authorization: [Authorize] & Claims

### Two levels of authorization in our app

**1. Just be logged in:**
```csharp
[Authorize]                    // any authenticated user
public IActionResult GetStudents() { ... }
```

**2. Be a specific role:**
```csharp
[Authorize(Roles = "Principal")]          // only Principal
[Authorize(Roles = "Principal,Teacher")]  // Principal OR Teacher
public IActionResult DeleteStudent(int id) { ... }
```

### Reading claims inside a controller

After JWT middleware validates the token, claims are available via `User`:

```csharp
// Get the logged-in user's ID
var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

// Get the role
var role = User.FindFirst(ClaimTypes.Role)?.Value;

// Or use the shortcut
var email = User.Identity?.Name;  // maps to ClaimTypes.Name
```

### Resource-based authorization in Our App

Some endpoints check not just role but **whether the resource belongs to the user**:

```csharp
// StudentsController.cs — GetStudent(id)
var role = User.FindFirst(ClaimTypes.Role)?.Value;
var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

// Students and parents can only view their own linked student
if (role is "Student" or "Parent")
{
    var user = _context.Users.Find(userId);
    if (user?.LinkedStudentId != id)
        return Forbid();  // 403 — they're authenticated but not allowed THIS resource
}
```

### `Forbid()` vs `Unauthorized()`

- `Unauthorized()` → **401** — "I don't know who you are" — no valid token
- `Forbid()` → **403** — "I know who you are, but you can't do this" — valid token, wrong role/resource

### Interview Questions
- What is the difference between 401 and 403?
- What is `ClaimTypes.NameIdentifier` and what value does it hold in our app?
- What is resource-based authorization vs role-based authorization?
- How would you implement policy-based authorization in ASP.NET Core?
- What is `User.Identity.IsAuthenticated` and when is it false?

---

## Step 15 — The Middleware Pipeline

### What middleware is

Every HTTP request in ASP.NET Core passes through a **pipeline** of middleware functions. Each middleware:
1. Does something before passing to the next
2. Calls `next()` to pass control forward
3. Optionally does something when control returns

```
Request → [CORS] → [Auth] → [Authorization] → [Controller] → Response
           ↑                                                      ↑
        adds headers                                          returns data
```

### Order is critical

```csharp
// Program.cs — THE ORDER MATTERS
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();            // 1. Must be first — preflight requests need CORS headers
app.UseAuthentication();  // 2. Reads JWT, populates HttpContext.User
app.UseAuthorization();   // 3. Checks [Authorize] — needs User from step 2
app.MapControllers();     // 4. Routes to the right controller action
```

### What happens if you get the order wrong

- `UseAuthorization` before `UseAuthentication` → User is always empty → all `[Authorize]` fail
- `UseCors` after `UseAuthentication` → CORS preflight requests get rejected before getting CORS headers → browser blocks all requests
- `MapControllers` before `UseAuthorization` → authorization is never checked

### Interview Questions
- What is middleware in ASP.NET Core?
- What is the difference between `Use`, `Run`, and `Map` middleware methods?
- Why does `UseCors` need to come before `UseAuthentication`?
- What is short-circuit middleware and when would you use it?
- What is the difference between a middleware and an action filter?

---

## Step 16 — Interface + Service Pattern

### Why use an interface?

```csharp
// Services/IEmailService.cs
public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl);
    Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl);
}
```

The controller depends on `IEmailService`, not `SmtpEmailService`. This means:
1. **Testable** — swap in a fake email service in unit tests
2. **Swappable** — switch from SMTP to SendGrid without changing any controller
3. **Dev/Prod split** — our app uses `SmtpEmailService` in prod and `DevEmailService` in dev

```csharp
// In Development — logs to console, doesn't send real emails
public class DevEmailService : IEmailService
{
    public Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        Console.WriteLine($"[DEV EMAIL] Reset link for {toEmail}: {resetUrl}");
        return Task.CompletedTask;
    }
}

// In Production — actually sends via SMTP
public class SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        // ... send real email via System.Net.Mail.SmtpClient
    }
}
```

```csharp
// Program.cs — register based on environment
if (app.Environment.IsDevelopment())
    builder.Services.AddScoped<IEmailService, DevEmailService>();
else
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
```

### Primary constructor injection (C# 12)

```csharp
// Old style:
public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;
    
    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }
}

// C# 12 primary constructor — same thing, less code:
public class SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger) : IEmailService
{
    // config and logger are available as parameters throughout the class
}
```

### Interview Questions
- What is the Dependency Inversion Principle and how does `IEmailService` demonstrate it?
- What is the difference between an interface and an abstract class?
- How does swapping `SmtpEmailService` for a test fake work with DI?
- What is a primary constructor in C# 12?
- Why is `ILogger<T>` generic (why does it take the class as a type parameter)?

---

## Step 17 — Secure Password Reset Flow

### The full flow

```
1. User submits email on "Forgot Password" page
2. POST /api/auth/forgot-password { email }
3. Server generates a secure random token, stores it in User.ResetToken with 1-hour expiry
4. Server sends email with link: https://app.com/reset-password?token=<TOKEN>
5. User clicks link, lands on Reset Password page
6. POST /api/auth/reset-password { token, newPassword }
7. Server finds user by token + checks not expired → updates password, clears token
```

### Security details

```csharp
// Secure token generation — cryptographically random
var token = Convert.ToHexString(
    System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)
); // 64-char hex string — 256 bits of entropy

user.ResetToken = token;
user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
await _context.SaveChangesAsync();
```

```csharp
// Email enumeration prevention — always return the same message
// whether or not the email exists in the DB
if (user == null)
    return Ok(new { message = "If that email is registered, a reset link has been sent." });
// (continues to send email if user exists)
return Ok(new { message = "If that email is registered, a reset link has been sent." });
```

```csharp
// Token validation — must exist AND not be expired
var user = _context.Users.FirstOrDefault(u =>
    u.ResetToken == dto.Token &&
    u.ResetTokenExpiry > DateTime.UtcNow);  // both conditions

if (user == null)
    return BadRequest(new { message = "This reset link is invalid or has expired." });

// Update password, clear the token (one-time use)
user.PasswordHash     = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
user.ResetToken       = null;
user.ResetTokenExpiry = null;
```

### Interview Questions
- What is email enumeration and how does returning the same message prevent it?
- Why is `RandomNumberGenerator` better than `Random` for security tokens?
- Why do we clear the token after it's used?
- What is the difference between a password reset token and a JWT?
- How would you store tokens more securely (hint: hash the token before storing)?

---

## Step 18 — Startup Bootstrap & Seed Data

### Bootstrapping the first admin user

Our app creates the Principal account automatically if no users exist:

```csharp
// Program.cs
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    db.Database.Migrate(); // apply migrations first

    if (!db.Users.Any())   // idempotent — only runs once
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
    }
}
```

### Dev seeder

In Development mode, we seed rich demo data (classes, students, marks, attendance) so the UI looks realistic:

```csharp
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<DevSeeder>().SeedIfEmpty();
}
```

`DevSeeder.SeedIfEmpty()` checks if data already exists before seeding — so restarting the app doesn't duplicate data.

### Interview Questions
- Why do we call `CreateScope()` inside `using` — what happens if we don't dispose it?
- What is idempotent and why should seed/bootstrap code always be idempotent?
- What is the difference between startup seed data and migration seed data (`modelBuilder.HasData(...)`)?
- What is `app.Environment.IsDevelopment()` checking under the hood?

---

## Step 19 — Swagger / OpenAPI

### What it is

Swagger (OpenAPI) auto-generates interactive API documentation from your controllers. You can test endpoints directly in the browser at `/swagger`.

### In Our App

```csharp
// Program.cs — register
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MySchool API", Version = "v1" });

    // Add the Bearer token input field to Swagger UI
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    // Apply it globally to all endpoints
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        },
        Array.Empty<string>()
    }});
});

// Program.cs — use (always available in our app, normally only in Development)
app.UseSwagger();
app.UseSwaggerUI();
```

### Interview Questions
- What is the difference between Swagger and OpenAPI?
- Why would you disable Swagger in production?
- What does `AddEndpointsApiExplorer()` do differently from `AddSwaggerGen()`?

---

## Step 20 — Async / Await

### The pattern

Some operations in our app use `async`/`await`, some don't. Here's the rule:

- **I/O bound work** (database, email, file, HTTP) → use `async`/`await`
- **CPU bound work** (calculations, in-memory) → sync is fine

```csharp
// Async — because we're hitting the database and sending email (I/O)
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
{
    var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);
    // ...
    await _context.SaveChangesAsync();     // async DB write
    await _email.SendPasswordResetAsync(...); // async email
    return Ok(...);
}

// Sync — simple DB reads returning immediately
[HttpGet]
public IActionResult GetStudents()
{
    var students = _context.Students.Include(s => s.Class).ToList(); // sync is fine
    return Ok(students);
}
```

### Why async matters for web apps

In a sync web app, while waiting for the database to respond, the thread is blocked — it can't handle other requests. With `async`, the thread is released back to the thread pool while waiting for I/O. Under high load, this means many more simultaneous requests with fewer threads.

### Interview Questions
- What is the difference between `async/await` and creating a new `Thread`?
- What is `Task` vs `Task<T>` and when do you return each?
- What is `async void` and why is it dangerous?
- What happens if you call `.Result` or `.Wait()` on a Task in ASP.NET Core? (Hint: deadlock)
- What is `ConfigureAwait(false)` and when do you need it?

---

# PART 2 — FRONTEND (React 18 + TypeScript + Vite)

*Will be added as we progress through the backend. Topics will include:*

- Vite project setup + TypeScript config
- React component model (function components, props, state)
- `useState` and `useEffect` hooks
- React Router v6 — routing, protected routes, navigation
- Axios — HTTP client, interceptors, JWT attachment, 401 redirect
- Context API vs prop drilling — role-based UI
- TypeScript in React — typing props, API responses, events
- CSS custom properties — the design system in `index.css`
- Form handling — controlled inputs, submit, validation
- Loading states & error handling
- Role-based rendering (`{role === 'Principal' && <button>...}`)

---

# Quick Reference: Build Order Checklist

Use this as your checklist when rebuilding from scratch:

### Backend
- [ ] Step 1: `dotnet new webapi`, solution setup, NuGet packages
- [ ] Step 2: Set up `appsettings.json` with connection string, JWT key
- [ ] Step 3: Write all Model classes (Class, Student, Mark, Achievement, Attendance, User, Enquiry)
- [ ] Step 4: Write `AppDbContext` with `DbSet` properties
- [ ] Step 5: Configure relationships in `OnModelCreating` (Achievement SetNull, User unique email index)
- [ ] Step 6: Run `dotnet ef migrations add InitialCreate` and inspect the generated file
- [ ] Step 7: Register `DbContext` in `Program.cs` with `AddDbContext`
- [ ] Step 8: Add CORS in `Program.cs`
- [ ] Step 9: Add JWT authentication in `Program.cs`
- [ ] Step 10: Add auto-migrate + Principal bootstrap on startup
- [ ] Step 11: Write `IEmailService` interface + `SmtpEmailService` + `DevEmailService`
- [ ] Step 12: Register email service (conditional by environment)
- [ ] Step 13: Write `AuthController` (Login, Signup, ForgotPassword, ResetPassword, ChangePassword)
- [ ] Step 14: Write `ClassesController` (CRUD with role authorization)
- [ ] Step 15: Write `StudentsController` (CRUD, resource-based auth for Student/Parent)
- [ ] Step 16: Write `MarksController` (CRUD, resource-based auth)
- [ ] Step 17: Write `AchievementsController` (CRUD)
- [ ] Step 18: Write `DashboardController` (stats, top students)
- [ ] Step 19: Write `UsersController` (staff/student/parent account creation, toggle active, delete)
- [ ] Step 20: Add Swagger with Bearer security definition
- [ ] Step 21: Write `DevSeeder` for dev data
- [ ] Step 22: Test every endpoint in Swagger

### Frontend (to be expanded)
- [ ] Vite + React + TypeScript setup
- [ ] Axios client with JWT interceptor
- [ ] Auth utils (getUser, getRole, logout)
- [ ] React Router setup + ProtectedRoute
- [ ] Layout with sidebar (role-based menu items)
- [ ] Login page
- [ ] Dashboard page
- [ ] Students page (list, add, edit, delete)
- [ ] Classes page
- [ ] Marks page
- [ ] My Marks page (Student role)
- [ ] My Child page (Parent role)
- [ ] Achievements page
- [ ] CSS design system

---

*Last updated: April 2026 — covers MySchool v1 backend completely.*
