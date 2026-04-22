using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MarksController : ControllerBase
{
    private readonly AppDbContext _context;

    public MarksController(AppDbContext context) => _context = context;

    [HttpGet]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult GetAllMarks()
    {
        var marks = _context.Marks
            .Include(m => m.Student).ThenInclude(s => s.Class)
            .Select(m => new
            {
                m.Id, m.Subject, m.Score, m.Term,
                m.StudentId,
                StudentName = m.Student.Name,
                ClassName = m.Student.Class.Name
            })
            .OrderBy(m => m.ClassName)
            .ThenBy(m => m.StudentName)
            .ToList();

        return Ok(marks);
    }

    [HttpGet("student/{studentId}")]
    public IActionResult GetMarksByStudent(int studentId)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role is "Student" or "Parent")
        {
            var user = _context.Users.Find(userId);
            if (user?.LinkedStudentId != studentId)
                return Forbid();
        }

        var marks = _context.Marks
            .Where(m => m.StudentId == studentId)
            .Select(m => new { m.Id, m.Subject, m.Score, m.Term })
            .OrderBy(m => m.Subject)
            .ToList();

        return Ok(marks);
    }

    public class CreateMarkDto
    {
        public int StudentId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public int Score { get; set; }
        public string? Term { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateMark([FromBody] CreateMarkDto dto)
    {
        if (!_context.Students.Any(s => s.Id == dto.StudentId))
            return BadRequest(new { message = "Student not found." });

        if (dto.Score < 0 || dto.Score > 100)
            return BadRequest(new { message = "Score must be between 0 and 100." });

        var mark = new Mark
        {
            StudentId = dto.StudentId,
            Subject = dto.Subject,
            Score = dto.Score,
            Term = dto.Term
        };

        _context.Marks.Add(mark);
        _context.SaveChanges();
        return Ok(mark);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult DeleteMark(int id)
    {
        var mark = _context.Marks.Find(id);
        if (mark == null) return NotFound();

        _context.Marks.Remove(mark);
        _context.SaveChanges();
        return Ok(new { message = "Mark deleted." });
    }
}
