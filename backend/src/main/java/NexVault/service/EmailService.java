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

    public void sendOrderReceiptEmail(String toEmail, String customerName, String orderId,
                                       String itemsHtml, String total, String paymentMethod) {
        if (fromAddress.contains("placeholder")) {
            log.warn("Mail not configured — receipt for order {} not sent", orderId);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, "NexVault");
            helper.setTo(toEmail);
            helper.setSubject("Your NexVault receipt — Order #" + orderId);
            helper.setText(buildReceiptHtml(customerName, orderId, itemsHtml, total, paymentMethod), true);
            mailSender.send(message);
            log.info("Receipt email sent to {} for order {}", toEmail, orderId);
        } catch (Exception e) {
            log.error("Failed to send receipt email for order {}: {}", orderId, e.getMessage());
        }
    }

    private String buildReceiptHtml(String name, String orderId, String itemsHtml,
                                    String total, String paymentMethod) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>NexVault Receipt</title>
            </head>
            <body style="margin:0;padding:0;background:#07070F;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#07070F;min-height:100vh;">
                <tr>
                  <td align="center" style="padding:40px 20px;">
                    <table width="560" cellpadding="0" cellspacing="0"
                           style="background:#0F0F1A;border-radius:16px;border:1px solid #1E1E2E;overflow:hidden;">

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#7C3AED,#22D3EE);padding:28px 32px;">
                          <div style="font-size:24px;font-weight:800;color:#fff;float:left;">&#9670; NexVault</div>
                          <div style="float:right;font-size:13px;color:rgba(255,255,255,.8);padding-top:6px;">Order Receipt</div>
                          <div style="clear:both"></div>
                        </td>
                      </tr>

                      <!-- Greeting -->
                      <tr>
                        <td style="padding:28px 32px 0;">
                          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#F1F0F7;">
                            Thank you, %s!
                          </p>
                          <p style="margin:0;font-size:13px;color:#9CA3AF;">
                            Your payment is confirmed. Here is your receipt.
                          </p>
                        </td>
                      </tr>

                      <!-- Order ID -->
                      <tr>
                        <td style="padding:16px 32px;">
                          <div style="background:#07070F;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;">
                            <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;">Order ID</span>
                            <span style="font-family:'Courier New',monospace;font-size:13px;color:#C084FC;">#%s</span>
                          </div>
                        </td>
                      </tr>

                      <!-- Items -->
                      <tr>
                        <td style="padding:0 32px;">
                          <div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Items</div>
                          <table width="100%%" cellpadding="8" cellspacing="0"
                                 style="border-collapse:collapse;font-size:14px;">
                            %s
                          </table>
                        </td>
                      </tr>

                      <!-- Total -->
                      <tr>
                        <td style="padding:16px 32px 8px;">
                          <div style="border-top:1px solid #1E1E2E;padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:14px;color:#9CA3AF;">Total charged via %s</span>
                            <span style="font-size:22px;font-weight:800;color:#C084FC;">%s</span>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding:20px 32px 32px;border-top:1px solid #1E1E2E;margin-top:12px;">
                          <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;line-height:1.6;">
                            Questions? Contact us at support@nexvault.in<br/>
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
            """.formatted(name, orderId, itemsHtml, paymentMethod, total);
    }

    public void sendContactFormEmail(String fromName, String fromEmail, String topic, String message) {
        if (fromAddress.contains("placeholder")) {
            log.warn("Mail not configured — contact form from {} ({}): {}", fromName, fromEmail, topic);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromAddress, "NexVault Contact Form");
            h.setTo("hashiflame@gmail.com");
            h.setReplyTo(fromEmail, fromName);
            h.setSubject("[NexVault Contact] " + topic + " — from " + fromName);
            h.setText(buildContactHtml(fromName, fromEmail, topic, message, "Contact Us", "contact.html"), true);
            mailSender.send(msg);
            log.info("Contact form email sent from {}", fromEmail);
        } catch (Exception e) {
            log.error("Failed to send contact form email: {}", e.getMessage());
        }
    }

    public void sendPartnershipFormEmail(String fromName, String fromEmail, String type, String message) {
        if (fromAddress.contains("placeholder")) {
            log.warn("Mail not configured — partnership form from {} ({}): {}", fromName, fromEmail, type);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromAddress, "NexVault Partnerships");
            h.setTo("hashiflame@gmail.com");
            h.setReplyTo(fromEmail, fromName);
            h.setSubject("[NexVault Partnership] " + type + " — from " + fromName);
            h.setText(buildContactHtml(fromName, fromEmail, type, message, "Partnerships", "partnerships.html"), true);
            mailSender.send(msg);
            log.info("Partnership form email sent from {}", fromEmail);
        } catch (Exception e) {
            log.error("Failed to send partnership form email: {}", e.getMessage());
        }
    }

    private String buildContactHtml(String name, String email, String topic,
                                    String message, String pageTitle, String pageFile) {
        String safeMsg = message == null ? "" : message
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("\n", "<br/>");
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>NexVault Form Submission</title>
            </head>
            <body style="margin:0;padding:0;background:#07070F;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#07070F;min-height:100vh;">
                <tr>
                  <td align="center" style="padding:40px 20px;">
                    <table width="560" cellpadding="0" cellspacing="0"
                           style="background:#0F0F1A;border-radius:16px;border:1px solid #1E1E2E;overflow:hidden;">

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#7C3AED,#22D3EE);padding:24px 32px;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:22px;font-weight:800;color:#fff;">&#9670; NexVault</td>
                              <td align="right" style="font-size:12px;color:rgba(255,255,255,.8);padding-top:4px;">
                                Form: <strong>%s</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Source page badge -->
                      <tr>
                        <td style="padding:20px 32px 0;">
                          <div style="display:inline-block;background:#1E1E2E;border:1px solid #7C3AED;
                                      border-radius:20px;padding:5px 14px;font-size:12px;color:#C084FC;
                                      font-weight:600;letter-spacing:.05em;">
                            Submitted from: nexvault.digital/%s
                          </div>
                        </td>
                      </tr>

                      <!-- Sender info -->
                      <tr>
                        <td style="padding:20px 32px 0;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                                 style="background:#07070F;border-radius:10px;border:1px solid #1E1E2E;">
                            <tr>
                              <td style="padding:14px 18px;border-bottom:1px solid #1E1E2E;">
                                <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;">Name</span><br/>
                                <span style="font-size:15px;color:#F1F0F7;font-weight:600;">%s</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:14px 18px;border-bottom:1px solid #1E1E2E;">
                                <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;">Email</span><br/>
                                <a href="mailto:%s" style="font-size:15px;color:#22D3EE;text-decoration:none;">%s</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:14px 18px;">
                                <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;">Topic / Type</span><br/>
                                <span style="font-size:15px;color:#C084FC;font-weight:600;">%s</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Message -->
                      <tr>
                        <td style="padding:20px 32px 32px;">
                          <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Message</div>
                          <div style="background:#07070F;border-radius:10px;border:1px solid #1E1E2E;
                                      padding:16px 18px;font-size:14px;color:#D1D5DB;line-height:1.7;">
                            %s
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding:16px 32px;border-top:1px solid #1E1E2E;text-align:center;">
                          <p style="margin:0;font-size:11px;color:#4B5563;">
                            This message was sent via the NexVault website contact form.<br/>
                            Reply directly to this email to respond to the sender.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(pageTitle, pageFile, name, email, email, topic, safeMsg);
    }

    private String buildSubject(String purpose, String otpCode) {
        if ("REGISTER".equals(purpose))    return "NexVault — Verify your email: " + otpCode;
        if ("KEY_REVEAL".equals(purpose))  return "NexVault — Key Access Code: " + otpCode;
        return "NexVault — Your login code: " + otpCode;
    }

    private String buildHtml(String userName, String otpCode, String purpose) {
        String title, subtitle;
        if ("REGISTER".equals(purpose)) {
            title    = "Verify your email";
            subtitle = "Enter this code to complete your NexVault registration.";
        } else if ("KEY_REVEAL".equals(purpose)) {
            title    = "Your Key Access Code";
            subtitle = "Enter this one-time code to reveal your activation key. It expires in 10 minutes.<br/>" +
                       "If you didn't request this, please secure your account immediately.";
        } else {
            title    = "Your login code";
            subtitle = "Enter this code to sign in to your NexVault account.";
        }

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
