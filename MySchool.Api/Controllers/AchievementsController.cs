using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AchievementsController(AppDbContext context) => _context = context;

    [HttpGet]
    public IActionResult GetAchievements()
    {
        var achievements = _context.Achievements
            .Include(a => a.Student)
            .Select(a => new
            {
                a.Id, a.Title, a.Description, a.ImageUrl, a.IsPublic,
                a.StudentId,
                StudentName = a.Student != null ? a.Student.Name : null
            })
            .OrderByDescending(a => a.Id)
            .ToList();

        return Ok(achievements);
    }

    public class CreateAchievementDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsPublic { get; set; }
        public int? StudentId { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Principal,Teacher")]
    public IActionResult CreateAchievement([FromBody] CreateAchievementDto dto)
    {
        var achievement = new Achievement
        {
            Title = dto.Title,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            IsPublic = dto.IsPublic,
            StudentId = dto.StudentId
        };

        _context.Achievements.Add(achievement);
        _context.SaveChanges();
        return Ok(achievement);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Principal")]
    public IActionResult DeleteAchievement(int id)
    {
        var a = _context.Achievements.Find(id);
        if (a == null) return NotFound();

        _context.Achievements.Remove(a);
        _context.SaveChanges();
        return Ok(new { message = "Achievement deleted." });
    }
}
