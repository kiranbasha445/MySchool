using Microsoft.AspNetCore.Mvc;
using MySchool.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class SeedController(DevSeeder seeder, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost]
    public IActionResult Seed()
    {
        if (!env.IsDevelopment())
            return Forbid();

        seeder.SeedIfEmpty();
        return Ok(new { message = "Seed complete. Check startup logs for details." });
    }
}
