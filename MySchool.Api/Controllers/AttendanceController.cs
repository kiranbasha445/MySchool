using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySchool.Api.Data;
using MySchool.Api.Models;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;
    public AttendanceController(AppDbContext context) => _context = context;

    // GET /api/Attendance?classId=1&date=2024-01-15  (Principal + Teacher only)
    [HttpGet]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> GetByClassAndDate([FromQuery] int classId, [FromQuery] DateTime date)
    {
        var day = date.Date;
        var students = await _context.Students
            .Where(s => s.ClassId == classId)
            .OrderBy(s => s.Name)
            .ToListAsync();

        var records = await _context.Attendances
            .Where(a => a.Student.ClassId == classId && a.Date.Date == day)
            .ToListAsync();

        var result = students.Select(s =>
        {
            var rec = records.FirstOrDefault(r => r.StudentId == s.Id);
            return new
            {
                studentId   = s.Id,
                studentName = s.Name,
                status      = rec?.Status ?? "Present",
                notes       = rec?.Notes,
                recordId    = rec?.Id
            };
        });

        return Ok(result);
    }

    // POST /api/Attendance/bulk  (Principal + Teacher only)
    [HttpPost("bulk")]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> SaveBulk([FromBody] BulkAttendanceRequest req)
    {
        var day = req.Date.Date;

        var classStudentIds = await _context.Students
            .Where(s => s.ClassId == req.ClassId)
            .Select(s => s.Id)
            .ToListAsync();

        var existing = await _context.Attendances
            .Where(a => a.Date.Date == day && classStudentIds.Contains(a.StudentId))
            .ToListAsync();

        _context.Attendances.RemoveRange(existing);

        var newRecords = req.Records.Select(r => new Attendance
        {
            StudentId = r.StudentId,
            Date      = day,
            Status    = r.Status,
            Notes     = r.Notes
        }).ToList();

        _context.Attendances.AddRange(newRecords);
        await _context.SaveChangesAsync();

        return Ok(new { saved = newRecords.Count });
    }

    // GET /api/Attendance/student/{studentId}
    // Principal/Teacher: any student | Student/Parent: only their linked student
    [HttpGet("student/{studentId:int}")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        var role   = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role is "Student" or "Parent")
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.LinkedStudentId != studentId)
                return Forbid();
        }

        var records = await _context.Attendances
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Date)
            .Select(a => new { a.Id, a.Date, a.Status, a.Notes })
            .ToListAsync();

        return Ok(records);
    }

    // GET /api/Attendance/summary?classId=1  (Principal + Teacher only)
    [HttpGet("summary")]
    [Authorize(Roles = "Principal,Teacher")]
    public async Task<IActionResult> GetSummary([FromQuery] int classId)
    {
        var students = await _context.Students
            .Where(s => s.ClassId == classId)
            .OrderBy(s => s.Name)
            .ToListAsync();

        var studentIds = students.Select(s => s.Id).ToList();

        var allRecords = await _context.Attendances
            .Where(a => studentIds.Contains(a.StudentId))
            .ToListAsync();

        var result = students.Select(s =>
        {
            var recs    = allRecords.Where(r => r.StudentId == s.Id).ToList();
            var total   = recs.Count;
            var present = recs.Count(r => r.Status == "Present");
            var absent  = recs.Count(r => r.Status == "Absent");
            var late    = recs.Count(r => r.Status == "Late");
            var excused = recs.Count(r => r.Status == "Excused");
            return new
            {
                studentId   = s.Id,
                studentName = s.Name,
                total,
                present,
                absent,
                late,
                excused,
                rate = total > 0 ? Math.Round((double)(present + late) / total * 100, 1) : (double?)null
            };
        });

        return Ok(result);
    }
}

public class BulkAttendanceRequest
{
    public int ClassId { get; set; }
    public DateTime Date { get; set; }
    public List<AttendanceRecord> Records { get; set; } = [];
}

public class AttendanceRecord
{
    public int StudentId { get; set; }
    public string Status { get; set; } = "Present";
    public string? Notes { get; set; }
}
