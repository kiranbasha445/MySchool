using MySchool.Api.Data;
using MySchool.Api.Models;

namespace MySchool.Api.Services;

public class DevSeeder(AppDbContext db, ILogger<DevSeeder> logger)
{
    public void SeedIfEmpty()
    {
        if (db.Students.Any()) return;

        logger.LogInformation("Dev seed: starting...");

        var rng = new Random(42);
        var password = BCrypt.Net.BCrypt.HashPassword("School@2024");

        // ── Users ────────────────────────────────────────────────────────
        var users = new List<User>
        {
            new() { Name = "Dr. Sarah Al-Mansouri", Email = "principal@school.com", PasswordHash = password, Role = "Principal", CreatedAt = DateTime.UtcNow },
            new() { Name = "Mr. Khalid Ibrahim",    Email = "teacher1@school.com",  PasswordHash = password, Role = "Teacher",   CreatedAt = DateTime.UtcNow },
            new() { Name = "Ms. Rania Hassan",      Email = "teacher2@school.com",  PasswordHash = password, Role = "Teacher",   CreatedAt = DateTime.UtcNow },
            new() { Name = "Mr. James Carter",      Email = "teacher3@school.com",  PasswordHash = password, Role = "Teacher",   CreatedAt = DateTime.UtcNow },
        };
        db.Users.AddRange(users.Where(u => !db.Users.Any(x => x.Email == u.Email)));
        db.SaveChanges();

        // ── Classes ───────────────────────────────────────────────────────
        var classes = Enumerable.Range(1, 10)
            .Select(i => new Class { Name = $"Class {i}" }).ToList();
        db.Classes.AddRange(classes);
        db.SaveChanges();

        var classMap = classes.ToDictionary(c => c.Name, c => c.Id);

        // ── Students + Marks ──────────────────────────────────────────────
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

        static string[] SubjectsFor(int classNum) => classNum switch
        {
            <= 3 => ["Mathematics", "English Language", "Science", "Arabic", "Art"],
            <= 6 => ["Mathematics", "English Language", "Science", "Arabic", "Social Studies", "Islamic Studies"],
            <= 9 => ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Arabic", "History", "Geography"],
            _    => ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Arabic", "History", "Computer Science"]
        };

        string[] terms = ["Term 1", "Term 2", "Term 3"];
        var students = new List<Student>();
        var marks    = new List<Mark>();

        for (int i = 0; i < 100; i++)
        {
            int classNum = (i / 10) + 1;
            int classId  = classMap[$"Class {classNum}"];
            string[] subs = SubjectsFor(classNum);
            int tier = i % 10 < 2 ? 0 : i % 10 < 8 ? 1 : 2;

            var student = new Student { Name = studentNames[i], ClassId = classId };
            db.Students.Add(student);
            db.SaveChanges();
            students.Add(student);

            foreach (var term in terms)
                foreach (var subject in subs)
                {
                    int score = tier switch
                    {
                        0 => rng.Next(35, 62),
                        2 => rng.Next(80, 99),
                        _ => rng.Next(58, 86),
                    };
                    marks.Add(new Mark
                    {
                        StudentId = student.Id,
                        Subject   = subject,
                        Score     = Math.Clamp(score + rng.Next(-5, 6), 0, 100),
                        Term      = term
                    });
                }
        }

        db.Marks.AddRange(marks);

        // ── Attendance (last 90 school days) ──────────────────────────────
        // Statuses weighted by student tier: high-tier students attend more
        string[][] statusPool =
        [
            ["Present", "Present", "Present", "Absent", "Late"],       // struggling
            ["Present", "Present", "Present", "Present", "Late"],       // average
            ["Present", "Present", "Present", "Present", "Present"],    // high achiever
        ];

        var schoolDays = Enumerable.Range(1, 90)
            .Select(d => DateTime.UtcNow.Date.AddDays(-d))
            .Where(d => d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Friday)
            .ToList();

        var attendance = new List<Attendance>();
        for (int i = 0; i < students.Count; i++)
        {
            int tier = i % 10 < 2 ? 0 : i % 10 < 8 ? 1 : 2;
            var pool = statusPool[tier];

            foreach (var day in schoolDays)
            {
                var status = pool[rng.Next(pool.Length)];
                attendance.Add(new Attendance
                {
                    StudentId = students[i].Id,
                    Date      = day,
                    Status    = status,
                    Notes     = status == "Absent" && rng.Next(3) == 0 ? "Parent notified" : null
                });
            }
        }

        db.Attendances.AddRange(attendance);

        // ── Achievements ──────────────────────────────────────────────────
        var achievements = new List<Achievement>
        {
            new() { Title = "Academic Excellence Award",     Description = "Awarded to the top-performing students of the academic year.", IsPublic = true },
            new() { Title = "Science Fair Champions",        Description = "First place in the inter-school science exhibition.", IsPublic = true },
            new() { Title = "National Mathematics Olympiad", Description = "School team placed 2nd in the national mathematics competition.", IsPublic = true },
            new() { Title = "Perfect Attendance",            Description = "Students who maintained 100% attendance throughout the term.", IsPublic = true },
            new() { Title = "Football Cup Winners",          Description = "Our school football team won the regional championship.", IsPublic = true },
            new() { Title = "Spelling Bee Champion",         Description = "Inter-school spelling competition — first place.", IsPublic = true },
            new() { Title = "Art & Culture Exhibition",      Description = "Celebrated creative talent across all classes in the annual art show.", IsPublic = true },
            new() { Title = "Community Service Award",       Description = "Outstanding contribution to community outreach programs.", IsPublic = true },
        };

        var topStudents = students.Where((_, idx) => idx % 10 >= 8).Take(4).ToList();
        if (topStudents.Count >= 2)
        {
            achievements.Add(new Achievement { Title = "Best Student — Class 1", Description = "Highest academic performance in Class 1.", IsPublic = true, StudentId = topStudents[0].Id });
            achievements.Add(new Achievement { Title = "Best Student — Class 2", Description = "Highest academic performance in Class 2.", IsPublic = true, StudentId = topStudents[1].Id });
        }

        db.Achievements.AddRange(achievements);

        // ── Demo login accounts (Student + Parent) ────────────────────────
        var demoAccounts = new[]
        {
            new { Email = "student1@school.com", Name = "Student Demo 1", Role = "Student", LinkedId = (int?)students[0].Id },
            new { Email = "student2@school.com", Name = "Student Demo 2", Role = "Student", LinkedId = (int?)students[1].Id },
            new { Email = "parent1@school.com",  Name = "Parent Demo 1",  Role = "Parent",  LinkedId = (int?)students[0].Id },
            new { Email = "parent2@school.com",  Name = "Parent Demo 2",  Role = "Parent",  LinkedId = (int?)students[1].Id },
        };

        foreach (var a in demoAccounts.Where(a => !db.Users.Any(u => u.Email == a.Email)))
            db.Users.Add(new User { Name = a.Name, Email = a.Email, PasswordHash = password, Role = a.Role, LinkedStudentId = a.LinkedId, CreatedAt = DateTime.UtcNow });

        db.SaveChanges();

        logger.LogInformation(
            "Dev seed complete — {Students} students, {Marks} marks, {Attendance} attendance records, {Achievements} achievements",
            students.Count, marks.Count, attendance.Count, achievements.Count);
    }
}
