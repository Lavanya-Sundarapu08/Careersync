package com.careersync.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * HTML email delivery service.
 * All methods are @Async — they never block the calling thread.
 * SMTP failures are swallowed with a warning so they never crash the event listener chain.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@careersync.dev}")
    private String fromAddress;

    // ── Public send methods ─────────────────────────────────────────────────

    @Async
    public void sendSlaBreachToCandidate(String candidateEmail, String candidateName,
                                          String jobTitle, String companyName) {
        String subject = "⚠️ No response from " + companyName + " — SLA breached";
        String html = breachCandidateHtml(candidateName, jobTitle, companyName);
        send(candidateEmail, subject, html);
    }

    @Async
    public void sendSlaBreachToRecruiter(String recruiterEmail, String recruiterName,
                                          String candidateName, String jobTitle, String stage) {
        String subject = "🔴 SLA Breach — " + jobTitle + " / " + candidateName;
        String html = breachRecruiterHtml(recruiterName, candidateName, jobTitle, stage);
        send(recruiterEmail, subject, html);
    }

    @Async
    public void sendSlaNudgeToRecruiter(String recruiterEmail, String recruiterName,
                                         String candidateName, String jobTitle, String deadline) {
        String subject = "⏰ Action needed: " + jobTitle + " / " + candidateName + " — SLA at 80%";
        String html = nudgeRecruiterHtml(recruiterName, candidateName, jobTitle, deadline);
        send(recruiterEmail, subject, html);
    }

    @Async
    public void sendStageUpdateToCandidate(String candidateEmail, String candidateName,
                                            String jobTitle, String companyName,
                                            String fromStage, String toStage) {
        String subject = "📋 Application update: " + jobTitle + " at " + companyName;
        String html = stageUpdateHtml(candidateName, jobTitle, companyName, fromStage, toStage);
        send(candidateEmail, subject, html);
    }

    // ── HTML templates ──────────────────────────────────────────────────────

    private String breachCandidateHtml(String name, String jobTitle, String companyName) {
        return baseTemplate(
            "SLA Deadline Missed",
            "#dc2626",
            "Hi " + name + ",",
            "<p style='margin:0 0 16px'>Unfortunately, <strong>" + companyName + "</strong> did not respond to your application for <strong>" + jobTitle + "</strong> within the guaranteed SLA window.</p>" +
            "<p style='margin:0 0 16px'>This has been <strong>flagged and recorded</strong> on CareerSync. The company's responsiveness score has been updated to reflect this breach.</p>" +
            "<p style='margin:0 0 16px'>You can view your application status in CareerSync — no further action is needed from your side.</p>",
            "View My Applications", "http://localhost:5173/my-applications"
        );
    }

    private String breachRecruiterHtml(String recruiterName, String candidateName,
                                        String jobTitle, String stage) {
        return baseTemplate(
            "SLA Breach — Action Required",
            "#dc2626",
            "Hi " + recruiterName + ",",
            "<p style='margin:0 0 16px'>An application from <strong>" + candidateName + "</strong> for the role <strong>" + jobTitle + "</strong> has breached its SLA at stage <strong>" + stage + "</strong>.</p>" +
            "<p style='margin:0 0 16px'>This has been recorded and your company's <strong>responsiveness score</strong> has been recalculated.</p>" +
            "<p style='margin:0 0 16px'>To avoid future breaches, please review pending applications in your queue promptly.</p>",
            "Open Recruiter Queue", "http://localhost:5173/recruiter/queue"
        );
    }

    private String nudgeRecruiterHtml(String recruiterName, String candidateName,
                                       String jobTitle, String deadline) {
        return baseTemplate(
            "SLA Reminder — 80% Elapsed",
            "#d97706",
            "Hi " + recruiterName + ",",
            "<p style='margin:0 0 16px'>This is a reminder that the application from <strong>" + candidateName + "</strong> for <strong>" + jobTitle + "</strong> is approaching its SLA deadline.</p>" +
            "<p style='margin:0 0 16px'>Deadline: <strong>" + deadline + "</strong></p>" +
            "<p style='margin:0 0 16px'>Please review and respond to avoid an SLA breach and score impact.</p>",
            "Review Now", "http://localhost:5173/recruiter/queue"
        );
    }

    private String stageUpdateHtml(String name, String jobTitle, String companyName,
                                    String fromStage, String toStage) {
        return baseTemplate(
            "Application Stage Updated",
            "#0d9488",
            "Hi " + name + ",",
            "<p style='margin:0 0 16px'>Your application for <strong>" + jobTitle + "</strong> at <strong>" + companyName + "</strong> has been updated.</p>" +
            "<table style='border-collapse:collapse;width:100%;margin:0 0 16px'>" +
            "<tr><td style='padding:10px 14px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:50%'>Previous Stage</td>" +
            "<td style='padding:10px 14px;background:#f1f5f9;border:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a'>" + fromStage + "</td></tr>" +
            "<tr><td style='padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#64748b'>Current Stage</td>" +
            "<td style='padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0d9488'>" + toStage + "</td></tr>" +
            "</table>" +
            "<p style='margin:0 0 16px'>Track your SLA countdown and full application history on CareerSync.</p>",
            "View Application", "http://localhost:5173/my-applications"
        );
    }

    /**
     * Base HTML email layout. Corporate, minimal, no heavy branding.
     */
    private String baseTemplate(String heading, String accentColor,
                                  String greeting, String bodyHtml, String ctaText, String ctaUrl) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1"/>
              <title>CareerSync</title>
            </head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-width:600px">
                    <!-- Header -->
                    <tr><td style="background:#1e3a5f;padding:20px 32px;border-bottom:3px solid %s">
                      <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">CareerSync</span>
                      <span style="font-size:11px;font-weight:500;color:#94a3b8;margin-left:8px;text-transform:uppercase;letter-spacing:0.5px">Anti-Ghosting Recruitment</span>
                    </td></tr>
                    <!-- Heading -->
                    <tr><td style="padding:28px 32px 0">
                      <p style="margin:0;font-size:20px;font-weight:700;color:#0f172a;border-left:3px solid %s;padding-left:12px">%s</p>
                    </td></tr>
                    <!-- Body -->
                    <tr><td style="padding:20px 32px;font-size:14px;color:#334155;line-height:1.7">
                      <p style="margin:0 0 16px;font-size:14px;color:#334155">%s</p>
                      %s
                    </td></tr>
                    <!-- CTA -->
                    <tr><td style="padding:0 32px 28px">
                      <a href="%s" style="display:inline-block;background:%s;color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:6px;font-size:14px;font-weight:600;">%s</a>
                    </td></tr>
                    <!-- Footer -->
                    <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
                      <p style="margin:0;font-size:11px;color:#94a3b8">You are receiving this because you have an active account on CareerSync. This is an automated message — please do not reply.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(accentColor, accentColor, heading, greeting, bodyHtml, ctaUrl, accentColor, ctaText);
    }

    // ── Internal send ───────────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.debug("Email sent to {} | subject: {}", to, subject);
        } catch (MessagingException e) {
            log.warn("Failed to send email to {} ({}): {}", to, subject, e.getMessage());
        }
    }
}
