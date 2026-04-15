package NexVault.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:placeholder@gmail.com}")
    private String fromAddress;

    /**
     * Sends an OTP email. If mail is not configured (placeholder address),
     * logs the OTP to the console instead so local dev works without SMTP.
     */
    public void sendOtpEmail(String toEmail, String userName, String otpCode, String purpose) {
        if (fromAddress.contains("placeholder")) {
            log.warn("=== MAIL NOT CONFIGURED — OTP for {} ({}): {} ===", toEmail, purpose, otpCode);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, "NexVault");
            helper.setTo(toEmail);
            helper.setSubject(buildSubject(purpose, otpCode));
            helper.setText(buildHtml(userName, otpCode, purpose), true);

            mailSender.send(message);
            log.info("OTP email sent to {} for purpose {}", toEmail, purpose);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            // Don't rethrow — we still log it above so dev can get the code from logs
            log.warn("=== FALLBACK OTP for {} ({}): {} ===", toEmail, purpose, otpCode);
        }
    }

    private String buildSubject(String purpose, String otpCode) {
        if ("REGISTER".equals(purpose)) {
            return "NexVault — Verify your email: " + otpCode;
        }
        return "NexVault — Your login code: " + otpCode;
    }

    private String buildHtml(String userName, String otpCode, String purpose) {
        String title   = "REGISTER".equals(purpose) ? "Verify your email" : "Your login code";
        String subtitle = "REGISTER".equals(purpose)
                ? "Enter this code to complete your NexVault registration."
                : "Enter this code to sign in to your NexVault account.";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>NexVault OTP</title>
            </head>
            <body style="margin:0;padding:0;background:#07070F;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#07070F;min-height:100vh;">
                <tr>
                  <td align="center" style="padding:40px 20px;">
                    <table width="520" cellpadding="0" cellspacing="0"
                           style="background:#0F0F1A;border-radius:16px;border:1px solid #1E1E2E;overflow:hidden;">

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#7C3AED,#22D3EE);padding:32px;text-align:center;">
                          <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                            &#9670; NexVault
                          </div>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:36px 40px;">
                          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F1F0F7;">
                            %s
                          </p>
                          <p style="margin:0 0 28px;font-size:14px;color:#9CA3AF;line-height:1.6;">
                            Hi %s, %s
                          </p>

                          <!-- OTP code box -->
                          <div style="background:#07070F;border:2px solid #7C3AED;border-radius:12px;
                                      padding:24px;text-align:center;margin-bottom:28px;">
                            <div style="font-size:42px;font-weight:800;letter-spacing:12px;
                                        color:#C084FC;font-family:'Courier New',monospace;">
                              %s
                            </div>
                          </div>

                          <p style="margin:0 0 20px;font-size:13px;color:#6B7280;text-align:center;">
                            &#128274; This code expires in <strong style="color:#F1F0F7;">10 minutes</strong>.
                            Never share it with anyone.
                          </p>

                          <hr style="border:none;border-top:1px solid #1E1E2E;margin:20px 0;"/>

                          <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;line-height:1.6;">
                            If you didn't request this code, you can safely ignore this email.<br/>
                            &copy; 2025 NexVault. All rights reserved.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(title, userName, subtitle, otpCode);
    }
}
