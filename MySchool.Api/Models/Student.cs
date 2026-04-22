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
