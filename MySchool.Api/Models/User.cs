namespace MySchool.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student"; // Principal, Teacher, Student, Parent
    public int? LinkedStudentId { get; set; }
    public Student? LinkedStudent { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Password reset
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
