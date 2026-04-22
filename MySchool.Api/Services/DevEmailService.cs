namespace MySchool.Api.Services;

// Development email service — logs to console instead of sending real email.
// Swap for SmtpEmailService in production by changing the DI registration in Program.cs.
public class DevEmailService(ILogger<DevEmailService> logger) : IEmailService
{
    public Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        logger.LogWarning(
            "\n========== PASSWORD RESET EMAIL ==========\n" +
            "To:      {Email} ({Name})\n" +
            "Link:    {Url}\n" +
            "==========================================", toEmail, toName, resetUrl);
        return Task.CompletedTask;
    }

    public Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl)
    {
        logger.LogWarning(
            "\n========== WELCOME EMAIL ==========\n" +
            "To:       {Email} ({Name})\n" +
            "Role:     {Role}\n" +
            "Password: {Password}\n" +
            "Login:    {Url}\n" +
            "====================================", toEmail, toName, role, tempPassword, loginUrl);
        return Task.CompletedTask;
    }
}
