using Microsoft.AspNetCore.Mvc;
using MySchool.Api.Data;
using MySchool.Api.Models;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public SeedController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost]
    public IActionResult Seed()
    {
        if (!_env.IsDevelopment())
            return Forbid();

        if (_context.Students.Any())
        {
            // Already seeded — but make sure demo student/parent accounts exist
            EnsureDemoAccounts();
            return BadRequest(new { message = "Database already seeded. To re-seed, clear the data first." });
        }

        var rng = new Random(42); // fixed seed = reproducible data

        // ── 1. User accounts ──────────────────────────────────────────
        var password = BCrypt.Net.BCrypt.HashPassword("School@2024");

        var users = new List<User>
        {
            new() { Name = "Dr. Sarah Al-Mansouri",  Email = "principal@school.com",  PasswordHash = password, Role = "Principal" },
            new() { Name = "Mr. Khalid Ibrahim",     Email = "teacher1@school.com",   PasswordHash = password, Role = "Teacher" },
            new() { Name = "Ms. Rania Hassan",       Email = "teacher2@school.com",   PasswordHash = password, Role = "Teacher" },
            new() { Name = "Mr. James Carter",       Email = "teacher3@school.com",   PasswordHash = password, Role = "Teacher" },
        };
        _context.Users.AddRange(users);
        _context.SaveChanges();
        // Student and Parent accounts are linked after students are created (below)

        // ── 2. Classes (Class 1 → 10) ─────────────────────────────────
        var classNames = Enumerable.Range(1, 10).Select(i => $"Class {i}").ToList();
        var classes = classNames.Select(n => new Class { Name = n }).ToList();
        _context.Classes.AddRange(classes);
        _context.SaveChanges();

        var classMap = classes.ToDictionary(c => c.Name, c => c.Id);

        // ── 3. Subjects by class level ────────────────────────────────
        static string[] SubjectsFor(int classNum) => classNum switch
        {
            <= 3 => ["Mathematics", "English Language", "Science", "Arabic", "Art"],
            <= 6 => ["Mathematics", "English Language", "Science", "Arabic", "Social Studies", "Islamic Studies"],
            <= 9 => ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Arabic", "History", "Geography"],
            _    => ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Arabic", "History", "Computer Science"]
        };

        // ── 4. Student names (100 students) ───────────────────────────
        string[] studentNames =
        [
            "Ahmed Hassan",      "Sara Ali",           "Mohammed Khalid",  "Fatima Sheikh",
            "Omar Abdullah",     "Zainab Rahman",      "Ali Hassan",       "Maryam Hussain",
            "Ibrahim Ahmed",     "Nadia Islam",        "Yusuf Khan",       "Layla Mahmoud",
            "Umar Farooq",       "Hana Ali",           "Bilal Rashid",     "Amina Qureshi",
            "Hamza Sheikh",      "Rania Hassan",       "Tariq Aziz",       "Sana Malik",
            "Khalid Ahmed",      "Nour Ibrahim",       "Saad Rahman",      "Dina Kamal",
            "Faisal Abdullah",   "Reem Omar",          "Waseem Ali",       "Yasmine Hassan",
            "Adnan Khalil",      "Hessa Mohammed",     "Ziad Karimi",      "Lina Sharif",
            "Ramzi Hassan",      "Mona Salem",         "Bassem Nour",      "Dalal Ahmed",
            "Karim Fouad",       "Noura Al-Rashid",    "Tarek Mansour",    "Shirin Moradi",
            "Amir Patel",        "Priya Sharma",       "Ryan Chen",        "Emily Johnson",
            "Marcus Williams",   "Sophia Brown",       "James Davis",      "Olivia Wilson",
            "Ethan Moore",       "Isabella Taylor",    "Noah Anderson",    "Mia Thomas",
            "Lucas Jackson",     "Charlotte White",    "Mason Harris",     "Amelia Martin",
            "Liam Thompson",     "Harper Garcia",      "Elijah Martinez",  "Evelyn Robinson",
            "James Clark",       "Luna Lewis",         "Benjamin Lee",     "Camila Walker",
            "Alexander Hall",    "Penelope Young",     "Henry Allen",      "Riley Hernandez",
            "Sebastian King",    "Nora Wright",        "Owen Scott",       "Lily Torres",
            "Aiden Nguyen",      "Ella Hill",          "Samuel Flores",    "Scarlett Green",
            "Jack Adams",        "Aria Nelson",        "David Carter",     "Chloe Mitchell",
            "Joseph Perez",      "Aurora Roberts",     "Charles Turner",   "Sofia Phillips",
            "Thomas Campbell",   "Maya Parker",        "Christopher Evans","Zoey Edwards",
            "Daniel Collins",    "Hazel Stewart",      "Matthew Sanchez",  "Grace Morris",
            "Anthony Rogers",    "Stella Reed",        "Mark Cook",        "Violet Morgan",
            "Daniel Bell",       "Aurora Murphy",      "Chris Bailey",     "Lily Rivera"
        ];

        string[] terms = ["Term 1", "Term 2", "Term 3"];

        var students = new List<Student>();
        var marks    = new List<Mark>();

        for (int i = 0; i < 100; i++)
        {
            int classNum  = (i / 10) + 1;           // 10 students per class
            string cName  = $"Class {classNum}";
            int classId   = classMap[cName];
            string[] subs = SubjectsFor(classNum);

            // Each student gets an ability tier: 0=struggling, 1=average, 2=high
            int tier = i % 10 < 2 ? 0 : i % 10 < 8 ? 1 : 2;

            var student = new Student
            {
                Name     = studentNames[i],
                ClassId  = classId,
            };
            students.Add(student);
            _context.Students.Add(student);
            _context.SaveChanges(); // need Id for marks

            foreach (var term in terms)
            {
                foreach (var subject in subs)
                {
                    int score = tier switch
                    {
                        0 => rng.Next(35, 62),   // struggling
                        2 => rng.Next(80, 99),   // high achiever
                        _ => rng.Next(58, 86),   // average
                    };
                    // Add ±5 noise so same-tier students aren't identical
                    score = Math.Clamp(score + rng.Next(-5, 6), 0, 100);

                    marks.Add(new Mark
                    {
                        StudentId = student.Id,
                        Subject   = subject,
                        Score     = score,
                        Term      = term
                    });
                }
            }
        }

        _context.Marks.AddRange(marks);

        // ── 5. Achievements ───────────────────────────────────────────
        var achievements = new List<Achievement>
        {
            new() { Title = "Academic Excellence Award",      Description = "Awarded to the top-performing students of the academic year.", IsPublic = true },
            new() { Title = "Science Fair Champions",         Description = "First place in the inter-school science exhibition.", IsPublic = true },
            new() { Title = "National Mathematics Olympiad",  Description = "School team placed 2nd in the national mathematics competition.", IsPublic = true },
            new() { Title = "Perfect Attendance",             Description = "Students who maintained 100% attendance throughout the term.", IsPublic = true },
            new() { Title = "Football Cup Winners",           Description = "Our school football team won the regional championship.", IsPublic = true },
            new() { Title = "Spelling Bee Champion",          Description = "Inter-school spelling competition — first place.", IsPublic = true },
            new() { Title = "Art & Culture Exhibition",       Description = "Celebrated creative talent across all classes in the annual art show.", IsPublic = true },
            new() { Title = "Community Service Award",        Description = "Recognised for outstanding contribution to community outreach programs.", IsPublic = true },
        };

        // Link top students (first two high-tier students per class) to individual achievements
        var topStudentIds = students
            .Where((_, idx) => idx % 10 == 8 || idx % 10 == 9)
            .Take(4)
            .Select(s => s.Id)
            .ToList();

        if (topStudentIds.Count >= 2)
        {
            achievements.Add(new Achievement
            {
                Title       = "Best Student — Class 1",
                Description = "Highest academic performance in Class 1 this year.",
                IsPublic    = true,
                StudentId   = topStudentIds[0]
            });
            achievements.Add(new Achievement
            {
                Title       = "Best Student — Class 2",
                Description = "Highest academic performance in Class 2 this year.",
                IsPublic    = true,
                StudentId   = topStudentIds.Count > 1 ? topStudentIds[1] : null
            });
        }

        _context.Achievements.AddRange(achievements);
        _context.SaveChanges();

        // ── 6. Student & Parent demo accounts ─────────────────────────
        EnsureDemoAccounts(students[0].Id, students[1].Id);

        // ── 7. Summary ────────────────────────────────────────────────
        return Ok(new
        {
            message      = "Database seeded successfully!",
            classes      = classes.Count,
            students     = students.Count,
            marks        = marks.Count,
            achievements = achievements.Count,
            accounts     = new object[]
            {
                new { email = "principal@school.com", password = "School@2024", role = "Principal" },
                new { email = "teacher1@school.com",  password = "School@2024", role = "Teacher"   },
                new { email = "teacher2@school.com",  password = "School@2024", role = "Teacher"   },
                new { email = "teacher3@school.com",  password = "School@2024", role = "Teacher"   },
                new { email = "student1@school.com",  password = "School@2024", role = "Student"   },
                new { email = "student2@school.com",  password = "School@2024", role = "Student"   },
                new { email = "parent1@school.com",   password = "School@2024", role = "Parent"    },
                new { email = "parent2@school.com",   password = "School@2024", role = "Parent"    },
            }
        });
    }

    private void EnsureDemoAccounts(int? student1Id = null, int? student2Id = null)
    {
        // Resolve linked student IDs from the DB if not supplied
        if (student1Id == null || student2Id == null)
        {
            var first2 = _context.Students.OrderBy(s => s.Id).Take(2).ToList();
            if (first2.Count >= 1) student1Id = first2[0].Id;
            if (first2.Count >= 2) student2Id = first2[1].Id;
        }

        var password = BCrypt.Net.BCrypt.HashPassword("School@2024");

        var accounts = new[]
        {
            new { Email = "student1@school.com", Name = "Student Demo 1", Role = "Student", LinkedId = student1Id },
            new { Email = "student2@school.com", Name = "Student Demo 2", Role = "Student", LinkedId = student2Id },
            new { Email = "parent1@school.com",  Name = "Parent Demo 1",  Role = "Parent",  LinkedId = student1Id },
            new { Email = "parent2@school.com",  Name = "Parent Demo 2",  Role = "Parent",  LinkedId = student2Id },
        };

        foreach (var a in accounts)
        {
            if (!_context.Users.Any(u => u.Email == a.Email))
            {
                _context.Users.Add(new User
                {
                    Name            = a.Name,
                    Email           = a.Email,
                    PasswordHash    = password,
                    Role            = a.Role,
                    LinkedStudentId = a.LinkedId
                });
            }
        }

        _context.SaveChanges();
    }
}
