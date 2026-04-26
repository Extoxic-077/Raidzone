package NexVault.service;

import NexVault.model.Order;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:support@raidzonemarket.com}")
    private String fromEmail;

    /**
     * Generic method used by StripeService / RazorpayService
     */
    @Async
    public void sendOrderReceiptEmail(String to, String name, String orderId, String itemsHtml, String total, String method) {
        String html = """
            <div style="background-color:#07070F; padding:40px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#9CA3AF; line-height:1.6;">
                <div style="max-width:540px; margin:0 auto; background-color:#0F0F1A; border:1px solid #1E1E2E; border-radius:32px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.4);">
                    <div style="background:linear-gradient(135deg,#7C3AED,#22D3EE); padding:40px; text-align:center;">
                        <div style="font-size:32px; font-weight:800; color:#fff; letter-spacing:-1px; margin-bottom:8px;">RAIDZONE</div>
                        <div style="color:rgba(255,255,255,0.8); font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:2px;">Order Confirmed</div>
                    </div>
                    <div style="padding:40px;">
                        <h2 style="color:#fff; font-size:20px; margin-top:0;">Thank you, %s!</h2>
                        <p style="font-size:15px;">Your order <strong>#%s</strong> has been processed successfully. We've assigned your digital assets and they are ready for delivery.</p>
                        
                        <div style="margin:32px 0; padding:24px; background-color:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:20px;">
                            <table style="width:100%%; border-collapse:collapse;">
                                %s
                                <tr>
                                    <td style="padding-top:20px; border-top:1px solid #1E1E2E; font-size:16px; font-weight:600; color:#fff;">Total Amount</td>
                                    <td style="padding-top:20px; border-top:1px solid #1E1E2E; text-align:right; font-size:22px; font-weight:800; color:#7C3AED;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align:center; margin-top:40px;">
                            <a href="https://raidzonemarket.com/orders.html" style="display:inline-block; padding:18px 36px; background-color:#7C3AED; color:#fff; text-decoration:none; font-weight:700; border-radius:16px; border-bottom:4px solid #5B21B6; transition:all 0.2s;">
                                Access My Digital Keys →
                            </a>
                        </div>
                        
                        <p style="margin-top:32px; font-size:13px; text-align:center; color:#4B5563;">
                            Payment Method: %s · Transaction verified securely.
                        </p>
                    </div>
                </div>
            </div>
            """.formatted(name, orderId, itemsHtml, total, method);

        sendRawEmail(to, "Order Receipt: #" + orderId + " — RAIDZONE", html);
    }

    /**
     * Used by OtpService
     */
    @Async
    public void sendOtpEmail(String to, String name, String code, String purpose) {
        String html = """
            <div style="background-color:#07070F; padding:40px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#9CA3AF; line-height:1.6;">
                <div style="max-width:420px; margin:0 auto; background-color:#0F0F1A; border:1px solid #1E1E2E; border-radius:32px; padding:40px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.4);">
                    <div style="margin-bottom:32px;">
                        <div style="width:64px; height:64px; background:rgba(124,58,237,0.1); border-radius:20px; margin:0 auto; display:flex; align-items:center; justify-content:center; border:1px solid rgba(124,58,237,0.2);">
                            <span style="font-size:32px;">🛡️</span>
                        </div>
                    </div>
                    <h2 style="color:#fff; font-size:22px; margin:0 0 8px 0;">Security Verification</h2>
                    <p style="font-size:14px; margin-bottom:32px;">Hello %s, use the code below to complete your <strong>%s</strong> request.</p>
                    
                    <div style="background-color:#07070F; border:1px dashed #7C3AED; border-radius:20px; padding:32px; margin-bottom:32px;">
                        <div style="font-size:36px; font-weight:800; color:#7C3AED; letter-spacing:8px; font-family:monospace;">%s</div>
                    </div>
                    
                    <p style="font-size:12px; color:#4B5563;">
                        This verification code is valid for 10 minutes.<br/>
                        If you did not request this, please secure your account immediately.
                    </p>
                    
                    <div style="margin-top:40px; padding-top:24px; border-top:1px solid #1E1E2E;">
                        <div style="font-size:12px; font-weight:700; color:#fff; letter-spacing:1px; text-transform:uppercase;">RAIDZONE SECURITY</div>
                    </div>
                </div>
            </div>
            """.formatted(name, purpose, code);

        sendRawEmail(to, "Verification Code: " + code + " — RAIDZONE", html);
    }

    @Async
    public void sendContactFormEmail(String name, String email, String topic, String message) {
        String html = """
            <div style="background-color:#07070F; padding:40px; font-family:sans-serif; color:#9CA3AF;">
                <div style="max-width:500px; margin:0 auto; background-color:#0F0F1A; border:1px solid #1E1E2E; border-radius:24px; padding:32px;">
                    <h2 style="color:#fff; margin-top:0;">New Contact Form Message</h2>
                    <p><strong>From:</strong> %s (%s)</p>
                    <p><strong>Topic:</strong> %s</p>
                    <hr style="border:0; border-top:1px solid #1E1E2E; margin:20px 0;">
                    <p style="white-space:pre-wrap;">%s</p>
                </div>
            </div>
            """.formatted(name, email, topic, message);

        sendRawEmail(fromEmail, "Contact Form: " + topic, html);
    }

    @Async
    public void sendPartnershipFormEmail(String name, String email, String type, String message) {
        String html = """
            <div style="background-color:#07070F; padding:40px; font-family:sans-serif; color:#9CA3AF;">
                <div style="max-width:500px; margin:0 auto; background-color:#0F0F1A; border:1px solid #7C3AED; border-radius:24px; padding:32px;">
                    <h2 style="color:#fff; margin-top:0;">New Partnership Enquiry</h2>
                    <p><strong>Partner:</strong> %s (%s)</p>
                    <p><strong>Type:</strong> %s</p>
                    <hr style="border:0; border-top:1px solid #1E1E2E; margin:20px 0;">
                    <p style="white-space:pre-wrap;">%s</p>
                </div>
            </div>
            """.formatted(name, email, type, message);

        sendRawEmail(fromEmail, "Partnership Enquiry: " + type, html);
    }

    private void sendRawEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to: {} with subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
        }
    }
}
