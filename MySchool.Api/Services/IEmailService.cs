namespace MySchool.Api.Services;

public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl);
    Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl);
}
