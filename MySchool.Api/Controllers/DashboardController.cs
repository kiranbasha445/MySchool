using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context) => _context = context;

    [HttpGet("stats")]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult GetStats()
    {
        var totalStudents = _context.Students.Count();
        var totalClasses = _context.Classes.Count();
        var totalMarks = _context.Marks.Count();
        var totalAchievements = _context.Achievements.Count();
        var averageScore = _context.Marks.Any()
            ? Math.Round(_context.Marks.Average(m => (double)m.Score), 1)
            : 0.0;

        var topStudents = _context.Students
            .Include(s => s.Marks)
            .Include(s => s.Class)
            .Where(s => s.Marks.Any())
            .AsEnumerable()
            .Select(s => new
            {
                s.Id,
                s.Name,
                ClassName = s.Class!.Name,
                Average = Math.Round(s.Marks.Average(m => (double)m.Score), 1)
            })
            .OrderByDescending(s => s.Average)
            .Take(5)
            .ToList();

        return Ok(new
        {
            totalStudents,
            totalClasses,
            totalMarks,
            totalAchievements,
            averageScore,
            topStudents
        });
    }
}
