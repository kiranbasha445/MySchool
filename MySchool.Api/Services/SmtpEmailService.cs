using System.Net;
using System.Net.Mail;

namespace MySchool.Api.Services;

public class SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetUrl)
    {
        var subject = "Reset your MySchool password";
        var body = $"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;">🎓</span>
                <h2 style="margin:8px 0 4px;color:#1e293b;">MySchool</h2>
              </div>
              <h3 style="color:#1e293b;margin-bottom:8px;">Hi {toName},</h3>
              <p style="color:#475569;line-height:1.6;">
                We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="{resetUrl}"
                   style="background:#4f46e5;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                  Reset Password →
                </a>
              </div>
              <p style="color:#94a3b8;font-size:12px;text-align:center;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            """;

        await SendAsync(toEmail, toName, subject, body);
    }

    public async Task SendWelcomeAsync(string toEmail, string toName, string role, string tempPassword, string loginUrl)
    {
        var subject = $"Welcome to MySchool — your {role} account is ready";
        var body = $"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;">🎓</span>
                <h2 style="margin:8px 0 4px;color:#1e293b;">MySchool</h2>
              </div>
              <h3 style="color:#1e293b;margin-bottom:8px;">Welcome, {toName}!</h3>
              <p style="color:#475569;line-height:1.6;">
                Your <strong>{role}</strong> account has been created. Here are your login details:
              </p>
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;font-family:monospace;">
                <div style="margin-bottom:6px;"><span style="color:#94a3b8;">Email:    </span><strong>{toEmail}</strong></div>
                <div><span style="color:#94a3b8;">Password: </span><strong>{tempPassword}</strong></div>
              </div>
              <p style="color:#475569;font-size:13px;">
                Please change your password after your first login via <em>Forgot Password</em> on the login page.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="{loginUrl}"
                   style="background:#4f46e5;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                  Log in to MySchool →
                </a>
              </div>
            </div>
            """;

        await SendAsync(toEmail, toName, subject, body);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var host     = config["Email:SmtpHost"]     ?? throw new InvalidOperationException("Email:SmtpHost not configured.");
        var port     = int.Parse(config["Email:SmtpPort"] ?? "587");
        var from     = config["Email:From"]         ?? throw new InvalidOperationException("Email:From not configured.");
        var password = config["Email:Password"]     ?? throw new InvalidOperationException("Email:Password not configured.");
        var fromName = config["Email:FromName"]     ?? "MySchool";

        using var client = new SmtpClient(host, port)
        {
            EnableSsl   = true,
            Credentials = new NetworkCredential(from, password),
        };

        using var message = new MailMessage
        {
            From       = new MailAddress(from, fromName),
            Subject    = subject,
            Body       = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(new MailAddress(toEmail, toName));

        try
        {
            await client.SendMailAsync(message);
            logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }
}
