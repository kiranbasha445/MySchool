namespace MySchool.Api.Models;

public class Achievement
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsPublic { get; set; }

    public int? StudentId { get; set; }
    public Student? Student { get; set; }
}
