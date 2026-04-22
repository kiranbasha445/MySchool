using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;
using System.Security.Claims;

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
                ClassName = s.Class.Name,
                MarksCount = s.Marks.Count,
                AverageScore = s.Marks.Any() ? Math.Round(s.Marks.Average(m => m.Score), 1) : (double?)null
            })
            .OrderBy(s => s.ClassName)
            .ThenBy(s => s.Name)
            .ToList();

        return Ok(students);
    }

    [HttpGet("{id}")]
    public IActionResult GetStudent(int id)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        // Students and parents can only view their linked student
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
        public string Name { get; set; } = string.Empty;
        public string? ProfileImage { get; set; }
        public int ClassId { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateStudent([FromBody] CreateStudentDto dto)
    {
        if (!_context.Classes.Any(c => c.Id == dto.ClassId))
            return BadRequest(new { message = "Class not found." });

        var student = new Student
        {
            Name = dto.Name,
            ProfileImage = dto.ProfileImage,
            ClassId = dto.ClassId
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

        student.Name = dto.Name;
        student.ProfileImage = dto.ProfileImage;
        student.ClassId = dto.ClassId;
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
