# MySchool — Interview Questions & Answers

> All questions come from the LEARNING_GUIDE bricks.
> Answers are written the way you'd explain them in an interview — confident, clear, with a real example.

---

# BRICK 1 — Project Setup & Minimal Hosting Model

---

**Q: What is the difference between a `.sln` and a `.csproj` file?**

A `.sln` (solution) is a container that groups one or more projects together. It contains no code — just file paths pointing to `.csproj` files. Visual Studio, Rider, and the `dotnet` CLI use it to open and build everything at once.

A `.csproj` (project) is the actual project file. It defines the target framework (`net8.0`), NuGet packages, build settings, and file includes. Each `.csproj` is a standalone buildable unit.

Real-world: a large app might have `MySchool.Api.csproj`, `MySchool.Tests.csproj`, and `MySchool.Shared.csproj` — all grouped in one `MySchool.sln`.

---

**Q: What did the Minimal Hosting Model replace? Why was it introduced?**

Before .NET 6, you needed two files:
- `Program.cs` — entry point that built and ran the host
- `Startup.cs` — had `ConfigureServices()` (DI registration) and `Configure()` (middleware pipeline)

From .NET 6 onwards, these merged into one `Program.cs`. The reasons: less boilerplate, easier to read, and top-level statements (C# 9+) mean you don't even need `class Program` or `static void Main`.

---

**Q: What does `builder.Build()` do? Why can't you add services after calling it?**

`builder.Build()` finalises the DI container — it compiles all the service registrations into an `IServiceProvider` and returns the `WebApplication`. After this point the container is locked. You can't add new services because the container has already been built and frozen. Trying to call `builder.Services.Add...` after `Build()` has no effect or throws.

---

**Q: What are top-level statements in C#? What does the compiler generate for you?**

Top-level statements (C# 9+) let you write code directly in a file without wrapping it in a class and `Main` method. The compiler generates the boilerplate for you:

```csharp
// What you write:
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.Run();

// What the compiler generates behind the scenes:
internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var app = builder.Build();
        app.Run();
    }
}
```

Only one file in a project can use top-level statements.

---

# BRICK 2 — Docker & Configuration

---

**Q: What is `docker-compose up -d` doing?**

It reads `docker-compose.yml`, creates and starts all the defined containers. The `-d` flag means "detached" — runs in the background so it doesn't block your terminal. Without `-d`, the logs stream to your terminal and `Ctrl+C` stops everything.

---

**Q: What is the difference between `POSTGRES_DB` and `POSTGRES_USER` in the environment?**

- `POSTGRES_USER` — the username of the superuser account created when the container initialises
- `POSTGRES_PASSWORD` — that user's password
- `POSTGRES_DB` — the name of the default database to create on first startup

If you omit `POSTGRES_DB`, a database named the same as `POSTGRES_USER` is created by default.

---

**Q: Why do we use environment variables in docker-compose instead of hardcoding in code?**

Three reasons:
1. **Twelve-factor app principle** — config belongs in the environment, not the code
2. **Security** — credentials in code get committed to git; environment variables stay out
3. **Flexibility** — you can change connection strings, passwords, and ports per environment (dev/staging/prod) without touching code

---

**Q: What is a Docker volume (`postgres_data`) and why do we use it?**

A Docker container's filesystem is temporary — when the container is removed, all its data is gone. A **named volume** (`postgres_data`) maps a directory inside the container to persistent storage managed by Docker on your host machine.

Without the volume: every `docker-compose down` wipes the database. With it: data survives container restarts and recreations.

---

# BRICK 3 — NuGet Packages

---

**Q: What is NuGet? How is it different from npm?**

NuGet is the .NET package manager. You declare dependencies in `.csproj` and NuGet downloads them from `nuget.org` (or a private feed) and restores them locally.

Key differences from npm:
- NuGet packages are stored globally on your machine (`~/.nuget/packages`), not per-project like `node_modules`
- No `package-lock.json` — instead `.csproj` has exact version numbers
- NuGet packages are compiled assemblies (`.dll`), not source code

---

**Q: What does `PrivateAssets="all"` do on a package reference?**

It marks the package as a build-time or development-time tool that should not be included in the published output or propagated to packages that depend on yours.

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0">
    <PrivateAssets>all</PrivateAssets>
</PackageReference>
```

The EF Core CLI tools (`dotnet ef migrations add`) are only needed during development. You don't need them shipped inside your Docker image running in production.

---

**Q: What is the difference between `dotnet restore` and `dotnet build`?**

- `dotnet restore` — downloads NuGet packages declared in `.csproj`. Only restores, does not compile.
- `dotnet build` — restores packages (if needed) AND compiles the code into assemblies. Build implies restore.

In practice you mostly use `dotnet build` — it does both.

---

**Q: Where are NuGet packages stored on your machine?**

Globally at `~/.nuget/packages` on Mac/Linux or `%userprofile%\.nuget\packages` on Windows. All projects on your machine share this cache. When you run `dotnet restore`, NuGet checks the global cache first before downloading from the internet.

---

# BRICK 4 — Domain Models

---

**Q: What is a POCO? Why does EF Core use them?**

**POCO** = Plain Old C# Object. A class with no base class, no attributes, no framework dependencies — just properties.

EF Core uses POCOs because:
1. Your domain models have no dependency on EF Core itself
2. You can use them in unit tests without a database
3. They're simple to read and write
4. EF Core figures out the mapping using **conventions** rather than requiring you to inherit from a special class

---

**Q: How does EF Core know `ClassId` is a foreign key without you explicitly saying so?**

EF Core's **convention**: if a class has a property named `[NavigationPropertyName]Id` AND a navigation property of that type, EF Core treats the `Id` property as the foreign key.

In `Student`:
```csharp
public int ClassId { get; set; }    // "Class" + "Id" = FK for Class navigation property
public Class Class { get; set; }    // navigation property named "Class"
```

EF sees these together and wires `ClassId` as `FK_Students_Classes_ClassId` automatically. No configuration needed.

---

**Q: What is the difference between a reference navigation property and a collection navigation property?**

- **Reference navigation** — points to a single related object. Represents the "one" side or the owning side.
  ```csharp
  public Class Class { get; set; } = null!;   // Student → one Class
  ```

- **Collection navigation** — points to a list of related objects. Represents the "many" side.
  ```csharp
  public List<Student> Students { get; set; } = [];  // Class → many Students
  ```

Both are optional from EF's perspective but you need at least one per relationship for EF to understand the relationship.

---

**Q: Why do we use `= null!` on navigation properties instead of `= new Class()`?**

If you wrote `= new Class()`, you'd create a fake empty `Class` object in memory. EF Core would see it as a real entity and try to insert it into the database — causing bugs or duplicate inserts.

`= null!` means: "this is physically null right now, but I'm telling the compiler's nullable checker to trust that EF Core will populate this when it loads the entity from the database." The `!` is the **null-forgiving operator** — it's a compile-time hint only, no runtime effect.

---

**Q: What is the difference between `int?` and `int` in an EF Core model?**

- `int` — required, maps to `integer NOT NULL` in the database. EF will never allow null.
- `int?` — optional, maps to `integer NULL` in the database. Used for optional foreign keys.

In `User.LinkedStudentId`:
```csharp
public int? LinkedStudentId { get; set; }  // Principal and Teachers have no linked student
```
A Teacher user has no student to link to, so this FK must be nullable.

---

**Q: What does `= []` mean in C# 12?**

It's a **collection expression** — shorthand for `new List<T>()`. The compiler infers the type from the property declaration.

```csharp
public List<Student> Students { get; set; } = [];
// Equivalent to:
public List<Student> Students { get; set; } = new List<Student>();
```

We initialise it to an empty list (not null) so that if EF Core doesn't load the collection (no `Include`), iterating it won't throw a `NullReferenceException`.

---

# BRICK 5 — DbContext

---

**Q: What is the EF Core change tracker? What is it tracking?**

The **change tracker** is an in-memory dictionary inside `DbContext` that records the state of every entity it knows about:

| State | Meaning |
|-------|---------|
| `Added` | New entity, will be INSERTed on `SaveChanges` |
| `Modified` | Existing entity with changes, will be UPDATEd |
| `Deleted` | Will be DELETEd |
| `Unchanged` | Loaded from DB, no changes |
| `Detached` | Not tracked |

When you call `_context.Students.Add(student)`, the student enters `Added` state. When you call `SaveChanges()`, EF looks at all tracked entities and generates the appropriate SQL for each.

---

**Q: When does EF Core actually execute SQL — when you call `.Where()` or `.ToList()`?**

EF Core uses **deferred execution**. LINQ methods like `.Where()`, `.OrderBy()`, `.Select()` build an expression tree — no SQL yet. SQL is only executed when you call a **terminal** method that needs actual data:

- `.ToList()` / `.ToArray()` — executes and returns all results
- `.FirstOrDefault()` / `.First()` — executes with `LIMIT 1`
- `.Any()` — executes `SELECT CASE WHEN EXISTS(...)`
- `.Count()` — executes `SELECT COUNT(*)`
- `.Single()` — executes and throws if not exactly one result
- Iterating with `foreach` — executes and streams results

This lets you build complex queries piece by piece before hitting the database once.

---

**Q: What is `OnModelCreating` and when do you use it vs data annotations?**

`OnModelCreating` is a method you override in `DbContext` to configure the model using the **Fluent API**. Data annotations are attributes you put directly on model properties.

Use **data annotations** for simple, self-documenting constraints:
```csharp
[Required]
[MaxLength(100)]
public string Name { get; set; }
```

Use **Fluent API (`OnModelCreating`)** for things you can't express with annotations:
- Unique indexes: `HasIndex(u => u.Email).IsUnique()`
- Composite keys
- Cascade delete behaviour: `OnDelete(DeleteBehavior.SetNull)`
- Complex relationships where conventions fail
- Table/column name overrides

Fluent API takes precedence over data annotations if both are present.

---

**Q: What is `DeleteBehavior.Cascade` vs `DeleteBehavior.SetNull`? When would you choose each?**

- **Cascade** — when the parent is deleted, all child records are also deleted. Use when children cannot meaningfully exist without the parent. Example: delete a `Class` → delete all its `Students`.

- **SetNull** — when the parent is deleted, the FK on child records is set to NULL. Use when children should survive but just lose the link. The FK must be nullable (`int?`). Example: delete a `Student` → `Achievement.StudentId` becomes NULL, the achievement survives.

- **Restrict** — refuse the delete if children exist. Forces you to handle children manually first.

---

**Q: What happens if you call `_context.Students.Add(student)` — what state is the entity in?**

The entity enters the `Added` state in the change tracker. Nothing is written to the database yet. Only when you call `_context.SaveChanges()` does EF Core generate and execute `INSERT INTO Students (...)`. Until then, the entity exists only in memory and its `Id` is `0` (the default int).

After `SaveChanges()`, EF Core populates `student.Id` with the database-generated identity value.

---

# BRICK 6 — Dependency Injection

---

**Q: What are the three DI lifetimes? Give a real-world example of each.**

**Singleton** — one instance for the entire app lifetime.
- Example: `IMemoryCache`, a configuration wrapper, an in-memory counter
- Risk: must be thread-safe because all requests share it

**Scoped** — one instance per HTTP request. Created when the request starts, disposed when it ends.
- Example: `AppDbContext` — each request gets its own change tracker, no cross-request contamination
- Example: a shopping cart service that accumulates items during one request

**Transient** — a new instance every time it's requested from the container.
- Example: a stateless validator, a lightweight helper class
- Risk: if injected into a Singleton, it gets created once and lives forever (defeats transient)

---

**Q: Why is DbContext Scoped and not Singleton?**

`DbContext` holds a **change tracker** in memory. If it were Singleton:
1. All concurrent requests share the same change tracker → corrupted state
2. Entity A loaded by Request 1 is visible to Request 2 — data leaks between users
3. The change tracker grows forever and is never reset — memory leak

Scoped = one `DbContext` per request = isolated change tracker = safe concurrency.

---

**Q: What happens if you inject a Scoped service into a Singleton?**

At runtime you get:

```
InvalidOperationException: Cannot consume scoped service 'AppDbContext'
from singleton 'MySingletonService'.
```

The Singleton lives for the app's entire lifetime. If it held a Scoped `DbContext`, that DbContext would also live forever — it would never be disposed, the change tracker would never be cleared, and you'd have the exact problems Scoped was designed to prevent. ASP.NET Core detects this and throws at startup (in Development mode with scope validation enabled).

---

**Q: Why do we call `CreateScope()` at startup instead of just `app.Services.GetService<AppDbContext>()`?**

`app.Services` is the **root service provider** — it acts as a Singleton scope. If you call `GetService<AppDbContext>()` directly on it, ASP.NET Core sees you're trying to resolve a Scoped service from a root (Singleton) container and throws the same error as above.

`CreateScope()` creates a proper child scope with its own lifetime. The `DbContext` is resolved within that scope, lives while the scope is alive, and is disposed cleanly when `scope.Dispose()` is called (via `using`).

---

**Q: What is `GetRequiredService<T>()` vs `GetService<T>()`?**

- `GetService<T>()` — returns `null` if the service is not registered. You have to null-check.
- `GetRequiredService<T>()` — throws `InvalidOperationException` if the service is not registered. Use this when the service MUST exist — it fails fast with a clear error message rather than a `NullReferenceException` somewhere deeper.

In production code, prefer `GetRequiredService<T>()` so misconfiguration is immediately obvious.

---

**Q: What is constructor injection? What are the alternatives?**

**Constructor injection** — dependencies are declared as constructor parameters. The DI container resolves them when creating the class. This is the standard and recommended approach in ASP.NET Core.

```csharp
public class StudentsController(AppDbContext context)  // constructor injection
```

**Property injection** — dependencies are set via public properties after construction. Not supported by ASP.NET Core's built-in DI container natively. Used in some other frameworks (e.g. older versions of ASP.NET MVC with `[Inject]`).

**Method injection** — dependencies injected into specific methods, not the class. In ASP.NET Core this happens with `[FromServices]` on an action parameter:

```csharp
public IActionResult Get([FromServices] IEmailService email) { ... }
```

Constructor injection is preferred because dependencies are explicit, visible, and the object can't exist without them.

---

# BRICK 7 — Migrations

---

**Q: What is the `__EFMigrationsHistory` table and what does EF Core store in it?**

A table EF Core creates automatically in your database. It has two columns:
- `MigrationId` — the migration name with timestamp prefix (e.g. `20260422172028_InitialCreate`)
- `ProductVersion` — the EF Core version that applied it

When you run `dotnet ef database update` or `db.Database.Migrate()`, EF checks this table to know which migrations have already been applied and skips them. It only runs migrations whose `MigrationId` is NOT in this table.

---

**Q: What is `AppDbContextModelSnapshot.cs`? Can you edit it manually?**

It's a C# file in the `Migrations/` folder that represents the **current state of your EF Core model** as EF understands it. EF Core uses it to calculate what has changed since the last migration — it diffs your current model against this snapshot to generate the next migration.

**Never edit it manually.** It's auto-generated. Manual edits confuse EF Core's diffing algorithm and can cause wrong or duplicate migrations. If it gets out of sync, you can regenerate it with `dotnet ef migrations remove` (removes the last migration) and re-adding it.

---

**Q: What is the difference between `dotnet ef database update` and `db.Database.Migrate()` in code?**

Both apply pending migrations, but differently:

- `dotnet ef database update` — CLI tool, run manually by a developer. Used during development. Requires the EF Core tools package and a database connection from your machine.

- `db.Database.Migrate()` — called from code at app startup. The running application applies its own migrations. Used for automated deployment — the app migrates itself when it starts up. No manual step needed on the server.

Both check `__EFMigrationsHistory` and only apply unapplied migrations.

---

**Q: If two developers add migrations simultaneously on different branches, what happens when you merge? How do you fix it?**

Both will have migrations with timestamps close together but different names and different snapshots. After merging, EF Core sees two migrations at the "end" — both branched from the same snapshot. Running `database update` will try to apply both but the second one won't know about the first.

**Fix:**
1. Delete both migration files AND the snapshot
2. Run `dotnet ef migrations add InitialMerge` — EF diffs current model against the database and generates one clean migration
3. Or: manually rebase — keep one migration, delete the other, re-generate from the merged snapshot

This is why teams often communicate before adding migrations, or use a dedicated migration step in the CI pipeline.

---

**Q: What is the difference between `db.Database.Migrate()` and `db.Database.EnsureCreated()`?**

- `EnsureCreated()` — creates the database schema from scratch based on the current model. **Ignores migrations completely.** If the database already exists, does nothing. Fast but you lose migration history and can't use `Migrate()` on the same database afterwards.

- `Migrate()` — applies pending migrations in order, respecting `__EFMigrationsHistory`. This is the production-safe approach.

**Rule:** Never use `EnsureCreated()` in a project that uses migrations. It's only suitable for quick prototypes or in-memory test databases.

---

**Q: What does `Down()` do and when would you call it?**

`Down()` is the **undo** method for a migration — it reverses what `Up()` did. If `Up()` creates a table, `Down()` drops it.

You call it by running:
```bash
dotnet ef database update PreviousMigrationName
```

This rolls back migrations down to the specified point. Useful in development when you realise your migration is wrong and want to fix the model before re-generating. In production, rolling back migrations is risky and rarely done — it often means data loss.

---

# BRICK 8 — Startup Bootstrap

---

**Q: Why do we use `CreateScope()` instead of injecting DbContext directly into startup code?**

At startup there is no HTTP request — no request scope exists. `AppDbContext` is registered as Scoped, meaning it needs a scope to live in. Calling `app.Services.GetRequiredService<AppDbContext>()` without a scope would try to resolve a Scoped service from the root Singleton container — ASP.NET Core throws `InvalidOperationException`.

`CreateScope()` creates a temporary scope, resolves `DbContext` within it, uses it, then disposes everything cleanly via the `using` block. This is the correct pattern for any code that needs Scoped services outside of a request.

---

**Q: What is `IConfiguration` and how does the colon `:` separator work?**

`IConfiguration` is the ASP.NET Core abstraction for reading settings from any source: `appsettings.json`, environment variables, command-line args, Azure Key Vault, etc.

The colon `:` represents **nesting** in the configuration hierarchy:

```json
{ "Jwt": { "Key": "secret" } }
```
```csharp
config["Jwt:Key"]  // reads the nested value
```

Environment variables use double underscore `__` as the separator (because `:` is not valid in all shell environments):
```bash
Jwt__Key=mysecret
```
ASP.NET Core automatically maps `__` to `:` when reading environment variables.

---

**Q: What is `??` (null coalescing operator) and how is it used here?**

`??` returns the left side if it's not null, otherwise returns the right side.

```csharp
var email = config["Bootstrap:PrincipalEmail"] ?? "principal@school.com";
// If config returns null (key not found), use the default value
```

`??=` is the null-coalescing assignment:
```csharp
email ??= "principal@school.com";
// Assigns only if email is currently null
```

Used extensively for providing safe defaults when config values are optional.

---

**Q: What is idempotent and why must startup/bootstrap code be idempotent?**

**Idempotent** means running the same operation multiple times produces the same result as running it once. No duplicates, no errors on re-run.

Our bootstrap code:
```csharp
if (!db.Users.Any())   // only run if no users exist
{
    db.Users.Add(new User { Role = "Principal", ... });
    db.SaveChanges();
}
```

Without the `if` check, every app restart would insert a new Principal user. The `Any()` guard makes it idempotent — it runs on every startup but only does work the very first time.

`db.Database.Migrate()` is also idempotent — EF checks `__EFMigrationsHistory` and only applies unapplied migrations.

---

**Q: What does `BCrypt.Net.BCrypt.HashPassword(password)` do? Why don't we store plain text?**

BCrypt takes the plain-text password and:
1. Generates a random **salt** (random bytes)
2. Combines the password + salt and runs it through the Blowfish cipher thousands of times (the "work factor")
3. Returns a 60-character string containing the algorithm, work factor, salt, and hash — all in one

```
$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
      ↑ work factor (2^11 = 2048 rounds)
```

If the database is breached, attackers get only these hashes. Without the original password they cannot log in, and BCrypt's slowness makes brute-force impractical. Plain-text storage means a single database breach exposes every user's password.

---

**Q: What is `db.Users.Any()` generating in SQL?**

```sql
SELECT CASE WHEN EXISTS (SELECT 1 FROM "Users" LIMIT 1) THEN TRUE ELSE FALSE END
```

It's more efficient than `db.Users.Count() > 0` because `EXISTS` stops as soon as it finds one row — it doesn't scan the entire table. EF Core is smart enough to translate `.Any()` to `EXISTS` rather than `COUNT`.

---

# BRICK 9 — CORS + JWT

---

**Q: What is CORS? Why does the browser enforce it but Postman doesn't?**

**CORS (Cross-Origin Resource Sharing)** is a browser security policy. By default, browsers block JavaScript code on `site-A.com` from making requests to `api-B.com` — this prevents malicious websites from making authenticated requests to other sites on behalf of a logged-in user (CSRF-style attacks).

Postman is not a browser. It has no concept of "origin" or "same-origin policy" — it just makes HTTP requests as instructed. The restriction is enforced by the **browser's JavaScript engine**, not the server.

CORS protects users, not servers. A server with no CORS headers is still accessible — just not from JavaScript running in a browser on a different origin.

---

**Q: What is a CORS preflight request? When does the browser send one?**

Before making certain cross-origin requests, the browser sends an automatic **OPTIONS** request (the preflight) to ask the server: "Do you allow this method and these headers from this origin?"

The browser sends a preflight when:
- The method is not GET, POST, or HEAD
- POST with Content-Type other than `text/plain`, `multipart/form-data`, or `application/x-www-form-urlencoded`
- Custom headers are present (like `Authorization`)

Our React app sends `Authorization: Bearer <token>` with every request → every request gets a preflight. This is why `UseCors()` must come first in the pipeline — the OPTIONS preflight must get a response with CORS headers before the browser allows the actual request.

---

**Q: What are the three parts of a JWT?**

A JWT is three Base64URL-encoded parts joined by dots: `header.payload.signature`

**Header** — algorithm and token type:
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** — claims (user data):
```json
{ "sub": "42", "role": "Principal", "exp": 1716239022 }
```

**Signature** — HMAC of `base64(header) + "." + base64(payload)` using your secret key. This is what prevents tampering.

You can decode the header and payload on jwt.io — they're just Base64, not encrypted. The signature is what makes the token trustworthy.

---

**Q: Why can't a client tamper with JWT claims?**

The signature is computed over the header + payload. If a client changes any claim in the payload (e.g. changes `"role": "Student"` to `"role": "Principal"`), the signature no longer matches the payload. When the server re-computes the signature using its secret key, it gets a different value → signature mismatch → token rejected with 401.

Only the server that knows the secret key can produce a valid signature. The client can read claims (payload is just Base64) but cannot forge them.

---

**Q: What is the difference between `ValidateIssuer` and `ValidateAudience`?**

- **Issuer** (`iss` claim) — who created the token. Validates the token came from a specific auth server. Useful in multi-service architectures where different services issue tokens.

- **Audience** (`aud` claim) — who the token is intended for. Validates this token was meant for THIS service and not another.

We set both to `false` in our app because it's a monolith — there's only one issuer (us) and one audience (us). In a microservices setup you'd validate both to prevent a token issued for Service A from being used against Service B.

---

**Q: What is `SymmetricSecurityKey` vs `RsaSecurityKey`?**

- **SymmetricSecurityKey** (HMAC-SHA256) — uses the **same secret key** to sign and verify. Fast and simple. The secret must be kept on the server — never shared. Used in monolithic apps where the same server signs and verifies tokens.

- **RsaSecurityKey** (RS256) — uses a **private key to sign** and a **public key to verify**. The private key stays secret on the auth server. The public key can be shared with any service that needs to verify tokens. Used in microservices or when a third-party auth server (like Auth0) issues tokens that your services verify.

Our app uses symmetric (same server signs and verifies) — simpler and fine for a monolith.

---

**Q: What is `DefaultAuthenticateScheme` vs `DefaultChallengeScheme`?**

- **DefaultAuthenticateScheme** — which scheme to use when reading an incoming request to determine who the user is. With JWT Bearer, this reads the `Authorization: Bearer <token>` header.

- **DefaultChallengeScheme** — which scheme to use when authentication fails and the app needs to challenge the client. With JWT Bearer, this returns a `401 Unauthorized` response with `WWW-Authenticate: Bearer` header.

Setting both to `JwtBearerDefaults.AuthenticationScheme` tells ASP.NET Core: "for all authentication and challenge actions, use JWT Bearer."

---

**Q: Why must `UseCors()` come before `UseAuthentication()`?**

When a React app sends a request with `Authorization: Bearer <token>`, the browser first sends a preflight **OPTIONS** request. If `UseCors()` isn't in the pipeline yet, the OPTIONS request either gets rejected or returns without CORS headers. The browser sees no CORS headers → blocks the actual request → the client never even sends the token.

CORS must run first to handle the preflight and attach the appropriate headers before authentication gets a chance to evaluate the token.

---

**Q: What happens if you put `UseAuthorization()` before `UseAuthentication()`?**

`UseAuthentication()` is what reads the JWT token and populates `HttpContext.User` with the claims. If `UseAuthorization()` runs before it, `HttpContext.User` is still empty (anonymous). Every endpoint decorated with `[Authorize]` will see an unauthenticated user and return 401, even when you send a valid token.

The correct order is always: Authenticate first (who are you?) → Authorize second (what are you allowed to do?).

---

# BRICK 10 — Swagger

---

**Q: What is the difference between Swagger and OpenAPI?**

**OpenAPI** is the specification — a standard (JSON/YAML format) for describing REST API endpoints, request/response shapes, authentication schemes, etc. It's maintained by the Linux Foundation.

**Swagger** is a set of tools built around the OpenAPI spec — most notably Swagger UI (the interactive HTML page) and Swagger Editor. The terms are often used interchangeably but they're not the same thing.

In .NET: `Swashbuckle.AspNetCore` generates the OpenAPI spec from your controllers and serves Swagger UI to browse and test it.

---

**Q: What does `AddEndpointsApiExplorer()` do?**

It registers `IApiDescriptionGroupCollectionProvider` — the service that inspects your controllers and minimal API endpoints to discover all routes, parameters, and return types. Swashbuckle uses this to know what to document. Without it, `AddSwaggerGen` generates an empty spec.

---

**Q: What does `AddSecurityRequirement` do vs `AddSecurityDefinition`?**

- `AddSecurityDefinition("Bearer", ...)` — defines that a security scheme called "Bearer" exists and describes how it works (HTTP Bearer token in the Authorization header). This adds the "Authorize" button to Swagger UI.

- `AddSecurityRequirement(...)` — applies that security scheme **globally** to all endpoints in the generated spec. This tells Swagger UI to include the token in every request it sends, making all locked endpoints testable.

Without `AddSecurityRequirement`, the padlock icon would appear on the button but no endpoints would actually use the token.

---

**Q: Why would you disable Swagger in production?**

1. **Information disclosure** — Swagger exposes every endpoint, parameter name, data shape, and error message. Attackers use it as a map.
2. **No authentication on the Swagger UI itself** — anyone who discovers `/swagger` can browse and test your API.
3. **Performance** — generating OpenAPI specs on every request has a small overhead.

Best practice: `if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }`. Or protect it behind auth/IP allowlist in staging.

---

# BRICK 11 — AuthController

---

**Q: What does `[ApiController]` do for model validation?**

When `[ApiController]` is present, ASP.NET Core automatically validates the incoming model using Data Annotations before your action method runs. If validation fails, it returns a `400 Bad Request` with a `ValidationProblemDetails` response — without you writing any validation code.

```csharp
public class LoginDto
{
    [Required]
    public string Email { get; set; }
}
// POST with no email → automatic 400, your action never runs
```

Without `[ApiController]`, you'd need to write `if (!ModelState.IsValid) return BadRequest(ModelState);` at the top of every action.

---

**Q: What is an over-posting attack? How does a DTO prevent it?**

If you bind a request body directly to your EF Core entity:
```csharp
[HttpPost]
public IActionResult Signup([FromBody] User user)  // DANGEROUS
{
    _context.Users.Add(user);
}
```

A malicious client can send: `{ "email": "hacker@evil.com", "password": "...", "role": "Principal" }`. The `Role` field gets set from the request body → the attacker created an admin account.

A DTO only exposes the fields you intend to accept:
```csharp
public class SignupDto
{
    public string Email    { get; set; }
    public string Password { get; set; }
    // No Role field — client can't set it
}
```

You explicitly control what the client can influence.

---

**Q: What is `ClaimTypes.NameIdentifier` — what value does it hold?**

`ClaimTypes.NameIdentifier` is a standard claim type constant whose string value is `"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"`. In our app we put the user's database ID in this claim:

```csharp
new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())  // e.g. "42"
```

In controllers, you read it back:
```csharp
var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
```

This is how you know which database user made the request without querying the database.

---

**Q: What is `BCrypt.Verify` doing? Where is the salt stored?**

`BCrypt.Verify(plainText, storedHash)` re-hashes the provided plain-text password using the **salt extracted from `storedHash`** and compares the result to the stored hash.

The BCrypt hash string encodes everything needed for verification:
```
$2a $ 11 $ [22-char salt] [31-char hash]
```

The salt is embedded in the stored hash. That's why `Verify` only needs the plain text and the stored hash — it extracts the salt itself. You never need to store the salt separately.

---

**Q: What is email enumeration? Why do we return the same message whether the email exists or not?**

Email enumeration is an attack where an attacker discovers which email addresses are registered on your system by observing different responses:

- `"Email not found"` → email is NOT registered → attacker knows this
- `"Reset link sent"` → email IS registered → attacker now has a list of valid emails

These lists are then used for phishing, credential stuffing, and spam campaigns.

The fix is always returning the same message:
```csharp
return Ok(new { message = "If that email is registered, a reset link has been sent." });
```

Whether the user exists or not, the response is identical. The attacker learns nothing.

---

**Q: Why is `RandomNumberGenerator` better than `new Random()` for security tokens?**

`System.Random` is a **pseudo-random number generator** — it uses a mathematical algorithm seeded by the current time. Its output is predictable if you know the seed. An attacker who knows approximately when a token was generated can brute-force the seed and predict the token.

`System.Security.Cryptography.RandomNumberGenerator` uses the **OS's cryptographically secure random source** (e.g. `/dev/urandom` on Linux, `CryptGenRandom` on Windows). Its output is genuinely unpredictable — no amount of computation can predict the next value.

For anything security-sensitive (tokens, passwords, nonces), always use `RandomNumberGenerator`.

---

**Q: What is `User.FindFirst(ClaimTypes.NameIdentifier)` — where does `User` come from?**

`User` is a property on `ControllerBase` of type `ClaimsPrincipal`. It's populated automatically by `UseAuthentication()` middleware when a valid JWT is present — the middleware reads the token, extracts its claims, and sets `HttpContext.User`.

`User.FindFirst(claimType)` searches the claims collection for the first claim of that type and returns a `Claim` object. The `.Value` property gives you the string value. The `?.Value` is null-safe — if no claim of that type exists, it returns null rather than throwing.

---

**Q: What is the difference between `Unauthorized()` (401) and `Forbid()` (403)?**

- **401 Unauthorized** — "I don't know who you are." No valid token, expired token, or no token at all. The client should authenticate and retry.

- **403 Forbidden** — "I know exactly who you are, but you're not allowed to do this." Valid token, valid user, but insufficient role or ownership. No point retrying with the same credentials.

In our app:
- No token → 401 (middleware handles this before reaching the controller)
- Valid Student token trying to see another student's data → `return Forbid()` → 403

---

# BRICK 12 — ClassesController

---

**Q: What is the difference between `[Authorize]` on a class vs on a method?**

`[Authorize]` on the **class** applies to every action in that controller — all actions require authentication by default.

`[Authorize(Roles = "Principal")]` on a specific **method** adds an additional role requirement ON TOP of the class-level `[Authorize]`.

```csharp
[Authorize]                         // all actions: must be authenticated
public class ClassesController
{
    [HttpGet]                       // authenticated ← inherits class-level
    public IActionResult Get() { }

    [HttpPost]
    [Authorize(Roles = "Principal")] // authenticated AND must be Principal
    public IActionResult Create() { }
}
```

You can override the class-level attribute on a specific method with `[AllowAnonymous]` to make that one action public.

---

**Q: What happens if `[Authorize]` is on the class and `[AllowAnonymous]` is on a method?**

`[AllowAnonymous]` wins — the method becomes publicly accessible regardless of the class-level `[Authorize]`. ASP.NET Core always respects `[AllowAnonymous]` over any `[Authorize]` attribute. This is useful for a controller where most actions require auth but one (like a health check or public stats) doesn't.

---

**Q: What is `ThenInclude` and when do you need it vs `Include`?**

`Include` loads a direct navigation property of the entity being queried.
`ThenInclude` loads a navigation property of the already-included entity — it goes one level deeper.

```csharp
_context.Marks
    .Include(m => m.Student)           // load Student for each Mark
    .ThenInclude(s => s.Class)         // then load Class for each Student
```

Without `ThenInclude`, `Student.Class` would be null. You need `ThenInclude` any time you want to go two or more relationships deep in one query.

---

**Q: What is the difference between `_context.Classes.Find(id)` and `_context.Classes.FirstOrDefault(c => c.Id == id)`?**

- `Find(id)` — first checks the **change tracker cache** (in-memory). If the entity was already loaded in this request, it returns it without hitting the database. If not in cache, executes `SELECT ... WHERE Id = @id`. Only works with primary key lookups.

- `FirstOrDefault(c => c.Id == id)` — always generates a `SELECT ... WHERE Id = @id` and hits the database, even if the entity is already in the change tracker. More flexible — works with any condition, not just primary keys.

Use `Find` for simple PK lookups when you want the cache benefit. Use `FirstOrDefault` when you need a complex predicate or you know the entity won't be in the cache.

---

**Q: What is LINQ projection (`.Select()`)? What SQL does EF generate?**

`.Select()` transforms each entity in the result set to a different shape — a DTO, an anonymous type, or a primitive. EF Core translates this to a SQL `SELECT` that only fetches the columns you referenced.

```csharp
_context.Classes
    .Select(c => new { c.Id, c.Name, StudentCount = c.Students.Count })
    .ToList();
```

Generated SQL (approximately):
```sql
SELECT c."Id", c."Name", (SELECT COUNT(*) FROM "Students" s WHERE s."ClassId" = c."Id")
FROM "Classes" c
```

EF only fetches `Id` and `Name` from the Classes table, plus a subquery for count — not every column. This is more efficient than loading full entities and projecting in memory.

---

# BRICK 13 — StudentsController

---

**Q: What is resource-based authorization vs role-based authorization?**

**Role-based** — checks the user's role: "Is this person a Teacher?"
```csharp
[Authorize(Roles = "Teacher")]
```

**Resource-based** — checks ownership of a specific resource: "Does this Teacher own THIS record?"
```csharp
if (user.LinkedStudentId != requestedStudentId)
    return Forbid();
```

Role-based is coarse-grained. Resource-based is fine-grained. In our app, a Student can call `GET /api/students/{id}` — but only for their own `id`. Role alone doesn't protect this; you need to check the specific resource.

---

**Q: What is `User.FindFirst(ClaimTypes.Role)` — what type is `User`?**

`User` is of type `System.Security.Claims.ClaimsPrincipal` — a property inherited from `ControllerBase`. It represents the authenticated user for the current request.

`FindFirst(ClaimTypes.Role)` scans the claims list for the first claim with type `"http://schemas.microsoft.com/ws/2008/06/identity/claims/role"` and returns a `Claim` object. `.Value` gives you the string role name like `"Principal"` or `"Teacher"`.

---

**Q: What is the `is "Student" or "Parent"` pattern in C# (pattern matching)?**

This is a **C# 9+ type pattern with `or`**. It checks whether `role` matches either string value:

```csharp
if (role is "Student" or "Parent")
```

This is equivalent to but more readable than:
```csharp
if (role == "Student" || role == "Parent")
```

Pattern matching with `is` also works with types, null checks, and property patterns:
```csharp
if (obj is Student { ClassId: 1 } s)  // type pattern with property check
```

---

**Q: Why do we check `user?.LinkedStudentId != id` and not just `user.LinkedStudentId != id`?**

`_context.Users.Find(userId)` returns `User?` — it can return null if the user ID from the JWT doesn't exist in the database (rare but possible: user was deleted after their token was issued). Without the `?.` null-conditional operator, accessing `.LinkedStudentId` on a null `user` would throw `NullReferenceException`.

The `?.` means: if `user` is null, return null instead of accessing the property. Then `null != id` is `true`, which means `Forbid()` is returned — the correct safe default.

---

**Q: What does `Forbid()` return vs `Unauthorized()`?**

`Forbid()` returns **HTTP 403 Forbidden** — you're authenticated but not allowed.
`Unauthorized()` returns **HTTP 401 Unauthorized** — you're not authenticated at all.

The naming in .NET is confusing (the method is called `Unauthorized` but HTTP 401 is described as "Unauthenticated"). Just remember:
- 401 → no/invalid token → need to log in
- 403 → valid token, valid user → but "no, you can't do that"

---

# BRICK 14 — MarksController

---

**Q: What is the N+1 problem? How does `Include` solve it?**

**N+1** is a common ORM performance bug. You load N entities, then for each one, EF makes an additional query to load its related data — resulting in N+1 total queries.

```csharp
// WITHOUT Include — N+1 problem:
var marks = _context.Marks.ToList();  // 1 query: loads 500 marks
foreach (var mark in marks)
{
    var name = mark.Student.Name;  // 500 queries: loads student for each mark
}
// Total: 501 queries
```

```csharp
// WITH Include — 1 query (or 2 at most):
var marks = _context.Marks.Include(m => m.Student).ToList();
// SQL: SELECT * FROM Marks LEFT JOIN Students ON ...
// Total: 1 query
```

`Include` generates a SQL JOIN so all data comes back in one round trip.

---

**Q: When do you use `ThenInclude` vs `Include`?**

- `Include` — for a direct navigation property of the root entity (one level deep)
- `ThenInclude` — for a navigation property of an already-included entity (two or more levels deep)

```csharp
_context.Marks
    .Include(m => m.Student)          // Mark → Student (one level)
    .ThenInclude(s => s.Class)        // Student → Class (two levels)
```

You chain as many `ThenInclude` calls as you need. Without `ThenInclude`, `mark.Student.Class` would be null.

---

**Q: What SQL does `_context.Marks.Include(m => m.Student).ThenInclude(s => s.Class)` generate?**

```sql
SELECT m."Id", m."Subject", m."Score", m."Term", m."StudentId",
       s."Id", s."Name", s."ClassId",
       c."Id", c."Name"
FROM "Marks" m
LEFT JOIN "Students" s ON m."StudentId" = s."Id"
LEFT JOIN "Classes" c ON s."ClassId" = c."Id"
```

A single SQL query with two JOINs — all three tables in one round trip.

---

# BRICK 16 — Email Service

---

**Q: What is the Dependency Inversion Principle?**

The D in SOLID: **high-level modules should not depend on low-level modules. Both should depend on abstractions.**

In our app:
- `AuthController` (high-level) depends on `IEmailService` (abstraction) — not on `SmtpEmailService` (low-level)
- `SmtpEmailService` and `DevEmailService` both implement `IEmailService`

The controller doesn't know or care how email is sent. You can swap the implementation (SMTP → SendGrid → console logger) without touching the controller. The controller's dependency points at the interface, not the concrete class.

---

**Q: What is the difference between an interface and an abstract class?**

| | Interface | Abstract Class |
|--|-----------|---------------|
| Instantiation | Cannot instantiate | Cannot instantiate |
| Implementation | Can have default implementations (C# 8+), but primarily contracts | Can have full implementations |
| State | No instance fields | Can have instance fields |
| Inheritance | A class can implement many interfaces | A class can only inherit one abstract class |
| Use case | Define a capability/contract ("can do X") | Define a shared base ("is a type of X") |

Use an interface when you want a contract multiple unrelated classes can fulfil. Use an abstract class when there's shared state or shared behaviour between closely related classes.

---

**Q: How does swapping implementations work with the DI container?**

The DI container maps `IEmailService` (the abstraction) to a concrete type. Whoever registered last wins.

```csharp
// In development — register DevEmailService for IEmailService
builder.Services.AddScoped<IEmailService, DevEmailService>();

// In production — register SmtpEmailService for IEmailService
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
```

`AuthController` declares `IEmailService` in its constructor. When the container creates the controller, it looks up `IEmailService` → finds whatever was registered → injects it. The controller never references the concrete type.

---

**Q: What is `builder.Environment.IsDevelopment()` checking?**

It reads the `ASPNETCORE_ENVIRONMENT` environment variable (or `DOTNET_ENVIRONMENT`). If the value equals `"Development"` (case-insensitive), it returns true.

Default value when running `dotnet run` locally: `"Development"`.
In Docker/production: typically set to `"Production"`.

You set it in `launchSettings.json` for local development, or as an environment variable in Docker Compose / Kubernetes.

---

**Q: What is `Task.CompletedTask` and why do we return it instead of `Task.FromResult(null)`?**

`Task.CompletedTask` is a **pre-completed, cached task** representing a successfully completed async operation with no return value. It's a singleton — the same object is reused everywhere, no allocation.

`Task.FromResult<object?>(null)` would create a new `Task<object?>` object each time — unnecessary allocation.

In methods declared as `async Task` that don't actually do anything async (like `DevEmailService`), returning `Task.CompletedTask` is the zero-cost way to satisfy the return type without triggering the async state machine.

---

**Q: What is `async Task` vs `async Task<T>`?**

- `async Task` — the method is asynchronous but returns no value. The caller can `await` it to wait for completion but gets nothing back. Equivalent to `void` in synchronous code but awaitable.

- `async Task<T>` — the method is asynchronous and returns a value of type `T` when complete. The caller `await`s it and gets the value.

```csharp
async Task SendEmailAsync() { ... }             // no return value
async Task<User> GetUserAsync(int id) { ... }   // returns a User
```

---

**Q: What is `async void` and why is it dangerous?**

`async void` makes a method asynchronous but fire-and-forget — the caller cannot `await` it, cannot catch exceptions from it, and has no way to know when it completes.

Dangers:
1. **Exceptions are unhandled** — an unhandled exception in an `async void` method crashes the process
2. **No way to wait** — the caller moves on immediately; if the app shuts down, the work is lost
3. **Testing is impossible** — you can't await it in a test

The ONLY acceptable use of `async void` is event handlers (e.g., button click handlers in WinForms/WPF), where the signature is mandated by the framework.

Rule: **never write `async void` in an ASP.NET Core app.** Always use `async Task`.

---

# BRICK 17 — DashboardController

---

**Q: What is the difference between `IQueryable<T>` and `IEnumerable<T>`?**

- `IQueryable<T>` — represents a query that has **not run yet**. Operations (`.Where()`, `.OrderBy()`, `.Select()`) add to the expression tree, which EF Core translates to SQL when you materialise it. **Executed by the database.**

- `IEnumerable<T>` — represents an **in-memory sequence**. Operations run as C# code on data already loaded into memory. **Executed by the application.**

```csharp
IQueryable<Student> q = _context.Students.Where(s => s.ClassId == 1);  // no SQL yet
IEnumerable<Student> e = q.AsEnumerable();  // everything after this is in-memory C#
```

---

**Q: What does `AsEnumerable()` do? What is the risk of calling it too early?**

`AsEnumerable()` breaks the `IQueryable` chain — it materialises what's been built so far into memory, then continues with in-memory LINQ. Operations after `AsEnumerable()` are C# lambdas, not SQL.

Risk of calling too early:
```csharp
// BAD — loads ALL 100,000 students into memory, then filters
_context.Students.AsEnumerable().Where(s => s.ClassId == 1)

// GOOD — filters 100,000 → ~30 students in SQL, then loads 30 into memory
_context.Students.Where(s => s.ClassId == 1).AsEnumerable()
```

Always filter (`.Where()`) before calling `AsEnumerable()`.

---

**Q: Why does `Math.Round(value, 1)` fail to translate to SQL but `Math.Round(value)` does not?**

EF Core only translates methods it explicitly has mappings for. `Math.Round(value)` (round to integer) maps directly to the SQL `ROUND(x)` function. But `Math.Round(value, 1)` (round to 1 decimal place) — the specific overload with decimal precision — does not have a reliable cross-database SQL translation (different databases handle this differently). So EF Core refuses to translate it and throws `InvalidOperationException`.

The fix is `AsEnumerable()` before the call so it runs in C# instead of SQL.

---

# BRICK 18 — UsersController

---

**Q: What is the difference between `SaveChanges()` and `SaveChangesAsync()`?**

Both persist tracked changes to the database. The difference is thread behaviour:

- `SaveChanges()` — **blocks** the calling thread while waiting for the database operation to complete. The thread cannot do anything else.

- `SaveChangesAsync()` — **releases** the thread while waiting. The thread goes back to the thread pool to handle other requests. When the database responds, a thread picks up where it left off.

In an ASP.NET Core web app with many concurrent requests, `SaveChangesAsync()` allows far better throughput under load. For a quick CLI script or test, the difference is negligible.

---

**Q: What is `async/await` and why does it matter for web app performance?**

`async/await` is C#'s mechanism for **non-blocking I/O**. When you `await` an I/O operation (database, HTTP call, file), the current thread is released back to the pool. When the I/O completes, a thread (possibly a different one) resumes execution.

In a web server:
- **Without async:** Thread A waits 50ms for a DB query, blocked and doing nothing.
- **With async:** Thread A starts the DB query, releases to the pool. 100 other requests can use that thread. When the DB responds, any free thread resumes the work.

A synchronous ASP.NET Core app on a server with 20 threads can handle maybe 20 concurrent DB calls. The same app with async can handle thousands — threads are reused while I/O is in flight.

---

**Q: What happens if you call `.Result` or `.Wait()` on a Task in ASP.NET Core?**

**Deadlock.** Here's why:

ASP.NET Core's synchronisation context means that when an `await` completes, the continuation is scheduled back to the original context (the request context). If you block that context with `.Result` or `.Wait()`, the continuation can never run — it's waiting for the thread you're currently blocking. Both are waiting for each other → deadlock.

```csharp
// DEADLOCK — do not do this:
var user = _context.Users.FindAsync(id).Result;

// CORRECT:
var user = await _context.Users.FindAsync(id);
```

Rule: if you `async`, go all the way. Never block on async code with `.Result` or `.Wait()`.

---

**Q: What is `HashSet<T>` and why use it over `List<T>` for the `Contains` check?**

`HashSet<T>.Contains(item)` is **O(1)** — it uses a hash table to find the element in constant time regardless of how many elements are in the set.

`List<T>.Contains(item)` is **O(n)** — it iterates through every element until it finds a match. For 100 items this is fine; for 100,000 it becomes a bottleneck.

```csharp
var linkedIds = _context.Users
    .Where(u => u.LinkedStudentId.HasValue)
    .Select(u => u.LinkedStudentId!.Value)
    .ToHashSet();  // O(1) lookups

// Later:
linkedIds.Contains(s.Id)  // O(1) vs O(n) for List
```

When you're going to call `Contains` many times against the same collection, convert to `HashSet` first.

---

**Q: What is `{id:int}` in the route template? What does the `:int` constraint do?**

Route constraints validate and convert the URL segment before it reaches your action. `:int` means "this segment must be parseable as an integer."

```csharp
[HttpDelete("{id:int}")]  // only matches /api/users/5 — not /api/users/abc
```

Without the constraint:
- `/api/users/abc` would match the route and reach your action with `id = 0` or cause a binding error
- Another route like `[HttpGet("{name}")]` might also match `/api/users/5` ambiguously

With `:int`, ASP.NET Core rejects non-integer segments at routing time with 404, before your code runs. Other constraints: `:guid`, `:bool`, `:minlength(3)`, `:range(1,100)`.

---

# BRICK 20 — PublicController

---

**Q: What SQL does `GroupBy(...).Select(g => new { ..., Count = g.Count() })` generate?**

```csharp
_context.Enquiries
    .GroupBy(e => e.ClassId)
    .Select(g => new { ClassId = g.Key, Count = g.Count() })
```

Generates:
```sql
SELECT e."ClassId", COUNT(*) AS "Count"
FROM "Enquiries" e
GROUP BY e."ClassId"
```

EF Core is smart enough to translate `GroupBy` + `Count()` into a SQL `GROUP BY` + `COUNT(*)`. The result is a compact set of rows — one per class, with the count.

---

**Q: What is `ToDictionary()` and why is it used here instead of a second database query?**

`ToDictionary(keySelector, valueSelector)` converts any `IEnumerable` into a `Dictionary<TKey, TValue>` for O(1) key lookups.

```csharp
var enquiryCounts = groupResult.ToDictionary(x => x.ClassId, x => x.Count);
// { 1 → 3, 2 → 7, 5 → 1 }
```

Then when building the classes list:
```csharp
Enquiries = enquiryCounts.GetValueOrDefault(c.Id, 0)
```

The alternative would be a separate database query for each class inside the `.Select()` loop — the N+1 problem. Loading all enquiry counts in one query + storing in a dictionary = one DB round trip total.

---

**Q: What is `GetValueOrDefault(key, defaultValue)` doing?**

On a `Dictionary<TKey, TValue>`, `GetValueOrDefault(key, defaultValue)` returns the value if the key exists, or the default value if it doesn't — without throwing `KeyNotFoundException`.

```csharp
enquiryCounts.GetValueOrDefault(classId, 0)
// If classId 3 is in the dictionary → returns its count
// If classId 3 is NOT in the dictionary → returns 0 (no enquiries)
```

Alternative with `TryGetValue`:
```csharp
enquiryCounts.TryGetValue(classId, out var count) ? count : 0
```

`GetValueOrDefault` is cleaner and does the same thing.

---

# BRICK 21 — DevSeeder

---

**Q: What is `AddRange` vs `Add` in terms of performance? What SQL does each generate?**

- `Add(entity)` — adds one entity to the change tracker. If called in a loop with `SaveChanges()` each time, you get one `INSERT` per iteration — N round trips to the database.

- `AddRange(list)` — adds all entities at once. When `SaveChanges()` is called once, EF Core generates a **single batched INSERT** (or a small number of batches). Far fewer round trips.

```csharp
// BAD — 500 round trips:
foreach (var mark in marks)
{
    db.Marks.Add(mark);
    db.SaveChanges();  // network round trip each time
}

// GOOD — 1-2 round trips:
db.Marks.AddRange(marks);
db.SaveChanges();  // EF batches into INSERT statements
```

For bulk operations, always `AddRange` + one `SaveChanges`.

---

**Q: What does `new Random(42)` do — why is 42 chosen?**

`new Random(42)` creates a pseudo-random number generator with a **fixed seed** of 42. A fixed seed means the sequence of generated numbers is identical every time the application runs — the data is reproducible.

This matters for the seeder: every time you delete the database and restart, you get the exact same 100 students, marks, and attendance records. This makes UI development predictable — you always have the same data to work with.

42 has no special significance. It's a convention from "The Hitchhiker's Guide to the Galaxy" (the answer to life, the universe, and everything). Any constant would work — the important thing is that it's fixed, not random.

---

**Q: What is a switch expression (`=>`) in C# and how is it different from a switch statement?**

A **switch expression** (C# 8+) evaluates to a value — you can assign it or use it inline.

```csharp
// Switch expression — returns a value
string[] subjects = classNum switch
{
    <= 3 => ["Maths", "English", "Science"],
    <= 6 => ["Maths", "English", "Science", "Arabic"],
    _    => ["Physics", "Chemistry", "Biology"]  // _ is the default case
};
```

A **switch statement** is imperative — you write code blocks with `break`:
```csharp
string[] subjects;
switch (classNum)
{
    case <= 3: subjects = ["Maths", "English"]; break;
    default: subjects = ["Physics"]; break;
}
```

Switch expressions are more concise, enforce exhaustiveness (compiler warns if you miss a case), and can be used anywhere an expression is expected (inline in LINQ, in a return statement, etc.).

---

**Q: What is `Math.Clamp(value, min, max)`?**

Returns `value` if it's between `min` and `max`. If `value < min`, returns `min`. If `value > max`, returns `max`. Prevents a value from going out of a valid range.

```csharp
Math.Clamp(105, 0, 100)  // → 100
Math.Clamp(-5,  0, 100)  // → 0
Math.Clamp(75,  0, 100)  // → 75
```

In the seeder, used to ensure generated scores stay between 0 and 100 even after adding random noise.

---

**Q: Why do we seed only in Development and not in Production?**

1. **Real data** — production has real students, teachers, marks. Seeding would add 100 fake students on every deployment.
2. **Security** — seed data uses predictable passwords (`School@2024`) and known email addresses. In production these would be valid login credentials.
3. **Idempotency** — the seeder checks `if (db.Students.Any()) return` but a failed deployment mid-seed could leave partial fake data.
4. **Performance** — seeding 100 students + thousands of marks + attendance records takes seconds. You don't want that on every production restart.

The `if (app.Environment.IsDevelopment())` guard ensures this code literally never runs anywhere except a developer's machine.

---

*End of interview answers — covers all 21 backend bricks.*
*Frontend (React/TypeScript) answers will be added when Part 2 bricks are written.*
