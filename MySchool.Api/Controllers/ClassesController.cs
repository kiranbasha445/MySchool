using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClassesController(AppDbContext context) => _context = context;

    [HttpGet("{id}")]
    public IActionResult GetClass(int id)
    {
        var cls = _context.Classes
            .Include(c => c.Students).ThenInclude(s => s.Marks)
            .FirstOrDefault(c => c.Id == id);

        if (cls == null) return NotFound();

        return Ok(new
        {
            cls.Id,
            cls.Name,
            Capacity = 40,
            Students = cls.Students
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.ProfileImage,
                    AverageScore = s.Marks.Count > 0
                        ? Math.Round(s.Marks.Average(m => m.Score), 1)
                        : (double?)null
                })
                .OrderBy(s => s.Name)
                .ToList()
        });
    }

    [HttpGet]
    public IActionResult GetClasses()
    {
        var classes = _context.Classes
            .Include(c => c.Students)
            .Select(c => new { c.Id, c.Name, StudentCount = c.Students.Count })
            .OrderBy(c => c.Name)
            .ToList();

        return Ok(classes);
    }

    public class CreateClassDto
    {
        public string Name { get; set; } = string.Empty;
    }

    [HttpPost]
    [Authorize(Roles = "Principal")]
    public IActionResult CreateClass([FromBody] CreateClassDto dto)
    {
        if (_context.Classes.Any(c => c.Name == dto.Name))
            return BadRequest(new { message = "A class with that name already exists." });

        var cls = new Class { Name = dto.Name };
        _context.Classes.Add(cls);
        _context.SaveChanges();
        return Ok(cls);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal")]
    public IActionResult DeleteClass(int id)
    {
        var cls = _context.Classes.Find(id);
        if (cls == null) return NotFound();

        _context.Classes.Remove(cls);
        _context.SaveChanges();
        return Ok(new { message = "Class deleted." });
    }
}
