namespace MySchool.Api.Models;

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<Student> Students { get; set; } = [];
}
