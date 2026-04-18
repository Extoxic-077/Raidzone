package NexVault.service;

import NexVault.model.EmailSubscriber;
import NexVault.model.User;
import NexVault.repository.EmailSubscriberRepository;
import NexVault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailCampaignService {

    private final EmailSubscriberRepository subscriberRepository;
    private final UserRepository            userRepository;
    private final JavaMailSender            mailSender;

    @Value("${spring.mail.username:placeholder@gmail.com}")
    private String fromAddress;

    @Transactional
    public void subscribe(String email) {
        subscriberRepository.findByEmail(email).ifPresentOrElse(
            sub -> sub.setSubscribed(true),
            () -> {
                EmailSubscriber sub = new EmailSubscriber();
                sub.setEmail(email);
                subscriberRepository.save(sub);
            }
        );
    }

    @Transactional
    public void unsubscribe(String email) {
        subscriberRepository.findByEmail(email).ifPresent(sub -> sub.setSubscribed(false));
        userRepository.findByEmail(email).ifPresent(u -> u.setEmailSubscribed(false));
    }

    public long countSubscribers() {
        return subscriberRepository.countBySubscribedTrue();
    }

    @Async
    public void sendCampaign(String subject, String htmlBody, boolean includeRegistered) {
        List<String> recipients = subscriberRepository.findAllActiveEmails();

        if (includeRegistered) {
            List<String> registered = userRepository.findAll().stream()
                    .filter(u -> Boolean.TRUE.equals(u.getEmailSubscribed()))
                    .map(User::getEmail)
                    .toList();
            java.util.LinkedHashSet<String> merged = new java.util.LinkedHashSet<>(recipients);
            merged.addAll(registered);
            recipients = List.copyOf(merged);
        }

        if (fromAddress.contains("placeholder")) {
            log.warn("Mail not configured — campaign '{}' would go to {} recipients", subject, recipients.size());
            return;
        }

        int sent = 0, failed = 0;
        for (String email : recipients) {
            try {
                MimeMessage msg = mailSender.createMimeMessage();
                MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
                h.setFrom(fromAddress, "NexVault");
                h.setTo(email);
                h.setSubject(subject);
                h.setText(wrapHtml(subject, htmlBody), true);
                mailSender.send(msg);
                sent++;
            } catch (Exception e) {
                log.warn("Campaign failed for {}: {}", email, e.getMessage());
                failed++;
            }
        }
        log.info("Campaign '{}' — sent: {}, failed: {}", subject, sent, failed);
    }

    private String wrapHtml(String subject, String body) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>%s</title>
            </head>
            <body style="margin:0;padding:0;background:#07070F;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#07070F;min-height:100vh;">
                <tr>
                  <td align="center" style="padding:40px 20px;">
                    <table width="560" cellpadding="0" cellspacing="0"
                           style="background:#0F0F1A;border-radius:16px;border:1px solid #1E1E2E;overflow:hidden;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#7C3AED,#22D3EE);padding:28px 32px;text-align:center;">
                          <div style="font-size:26px;font-weight:800;color:#fff;">&#9670; NexVault</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:36px 40px;color:#F1F0F7;font-size:15px;line-height:1.7;">
                          %s
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 40px 32px;border-top:1px solid #1E1E2E;">
                          <p style="margin:0;font-size:12px;color:#4B5563;text-align:center;">
                            You are receiving this because you subscribed to NexVault updates.<br/>
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
            """.formatted(subject, body);
    }
}
