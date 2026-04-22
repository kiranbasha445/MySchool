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
