using Microsoft.AspNetCore.Mvc;
using MySchool.Api.Data;
using MySchool.Api.Models;
using MySchool.Api.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;

    public AuthController(AppDbContext context, IConfiguration config, IEmailService email)
    {
        _context = context;
        _config  = config;
        _email   = email;
    }

    public class SignupDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
        public int? LinkedStudentId { get; set; }
    }

    [HttpPost("signup")]
    public IActionResult Signup([FromBody] SignupDto dto)
    {
        if (_context.Users.Any(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already in use." });

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            LinkedStudentId = dto.LinkedStudentId
        };

        _context.Users.Add(user);
        _context.SaveChanges();

        return Ok(new { message = "Account created successfully." });
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

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

        return Ok(new
        {
            token = tokenHandler.WriteToken(token),
            user = new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                linkedStudentId = user.LinkedStudentId
            }
        });
    }

    // ── Forgot password ────────────────────────────────────────────────────
    public class ForgotPasswordDto { public string Email { get; set; } = string.Empty; }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email.Trim().ToLower());

        // Always return 200 to avoid email enumeration
        if (user == null)
            return Ok(new { message = "If that email is registered, a reset link has been sent." });

        // Generate a secure token valid for 1 hour
        var token  = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        user.ResetToken       = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        var frontendBase = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var resetUrl     = $"{frontendBase}/reset-password?token={token}";

        await _email.SendPasswordResetAsync(user.Email, user.Name, resetUrl);

        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    // ── Reset password ─────────────────────────────────────────────────────
    public class ResetPasswordDto
    {
        public string Token       { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Token and new password are required." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = _context.Users.FirstOrDefault(u =>
            u.ResetToken == dto.Token &&
            u.ResetTokenExpiry > DateTime.UtcNow);

        if (user == null)
            return BadRequest(new { message = "This reset link is invalid or has expired." });

        user.PasswordHash    = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.ResetToken      = null;
        user.ResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password updated successfully. You can now log in." });
    }

    // ── Change own password (while logged in) ──────────────────────────────
    [HttpPost("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
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

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword     { get; set; } = string.Empty;
    }
}
