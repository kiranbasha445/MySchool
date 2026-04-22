using Microsoft.EntityFrameworkCore;
using MySchool.Api.Models;

namespace MySchool.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Class> Classes { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Mark> Marks { get; set; }
    public DbSet<Achievement> Achievements { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Enquiry> Enquiries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Achievement>()
            .HasOne(a => a.Student)
            .WithMany(s => s.Achievements)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
