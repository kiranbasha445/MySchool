using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;
using MySchool.Api.Services;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;

    public UsersController(AppDbContext context, IEmailService email, IConfiguration config)
    {
        _context = context;
        _email   = email;
        _config  = config;
    }

    // ── List all users (Principal only) ───────────────────────────────────
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

    // ── Create staff account (Principal only) ─────────────────────────────
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

        return Ok(new
        {
            message      = "Staff account created.",
            user         = new { user.Id, user.Name, user.Email, user.Role },
            tempPassword  // shown in UI so staff can hand it to the teacher
        });
    }

    // ── Create student portal account (Principal + Teacher) ───────────────
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

        return Ok(new
        {
            message      = "Student portal account created.",
            user         = new { user.Id, user.Name, user.Email, user.Role, user.LinkedStudentId },
            tempPassword
        });
    }

    // ── Create parent portal account (Principal + Teacher) ────────────────
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

        return Ok(new
        {
            message      = "Parent portal account created.",
            user         = new { user.Id, user.Name, user.Email, user.Role, user.LinkedStudentId },
            tempPassword
        });
    }

    // ── Toggle active status (Principal only) ─────────────────────────────
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

    // ── Delete account (Principal only) ───────────────────────────────────
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

    // ── Students without a portal account (for account creation dropdowns) ─
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
        var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        var bytes = new byte[10];
        rng.GetBytes(bytes);
        return new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────
public class CreateStaffDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
}

public class CreateLinkedAccountDto
{
    public int StudentId { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
}
