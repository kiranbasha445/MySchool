using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _context;
    public PublicController(AppDbContext context) => _context = context;

    [HttpGet("stats")]
    public IActionResult GetStats() => Ok(new
    {
        students     = _context.Students.Count(),
        classes      = _context.Classes.Count(),
        achievements = _context.Achievements.Count(a => a.IsPublic),
        marks        = _context.Marks.Count(),
    });

    [HttpGet("achievements")]
    public IActionResult GetAchievements()
    {
        var list = _context.Achievements
            .Where(a => a.IsPublic)
            .Include(a => a.Student)
            .OrderByDescending(a => a.Id)
            .Select(a => new
            {
                a.Id, a.Title, a.Description,
                StudentName = a.Student != null ? a.Student.Name : null
            })
            .ToList();

        return Ok(list);
    }

    // Public classroom list — seat counts + pending enquiries, no student data
    [HttpGet("classes")]
    public IActionResult GetPublicClasses()
    {
        var enquiryCounts = _context.Enquiries
            .GroupBy(e => e.ClassId)
            .Select(g => new { ClassId = g.Key, Count = g.Count() })
            .ToDictionary(x => x.ClassId, x => x.Count);

        var classes = _context.Classes
            .Include(c => c.Students)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                Capacity    = 40,
                Occupied    = c.Students.Count,
                Available   = 40 - c.Students.Count,
            })
            .ToList()
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Capacity,
                c.Occupied,
                c.Available,
                Enquiries = enquiryCounts.GetValueOrDefault(c.Id, 0)
            });

        return Ok(classes);
    }

    // Public classroom detail — occupancy grid only, no student names
    [HttpGet("classes/{id:int}")]
    public IActionResult GetPublicClass(int id)
    {
        var cls = _context.Classes
            .Include(c => c.Students)
            .FirstOrDefault(c => c.Id == id);

        if (cls == null) return NotFound();

        var enquiryCount = _context.Enquiries.Count(e => e.ClassId == id);
        var occupied     = cls.Students.Count;

        return Ok(new
        {
            cls.Id,
            cls.Name,
            Capacity     = 40,
            Occupied     = occupied,
            Available    = 40 - occupied,
            Enquiries    = enquiryCount,
            // Just a list of true/false for each seat slot (no names)
            Seats = Enumerable.Range(0, 40).Select(i => i < occupied)
        });
    }

    // Submit admission enquiry (public)
    [HttpPost("enquiry")]
    public IActionResult SubmitEnquiry([FromBody] EnquiryDto dto)
    {
        if (!_context.Classes.Any(c => c.Id == dto.ClassId))
            return BadRequest(new { message = "Class not found." });

        if (string.IsNullOrWhiteSpace(dto.ParentName) ||
            string.IsNullOrWhiteSpace(dto.ParentEmail) ||
            string.IsNullOrWhiteSpace(dto.StudentName))
            return BadRequest(new { message = "Name, email, and student name are required." });

        var enquiry = new Enquiry
        {
            ClassId     = dto.ClassId,
            ParentName  = dto.ParentName.Trim(),
            ParentEmail = dto.ParentEmail.Trim(),
            StudentName = dto.StudentName.Trim(),
            Message     = dto.Message?.Trim(),
            CreatedAt   = DateTime.UtcNow
        };

        _context.Enquiries.Add(enquiry);
        _context.SaveChanges();

        return Ok(new { message = "Enquiry submitted successfully. The school will contact you soon." });
    }
}

public class EnquiryDto
{
    public int ClassId { get; set; }
    public string ParentName { get; set; } = string.Empty;
    public string ParentEmail { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? Message { get; set; }
}
