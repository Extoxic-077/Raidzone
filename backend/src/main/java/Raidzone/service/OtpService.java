package Raidzone.service;

import Raidzone.exception.UnauthorizedException;
import Raidzone.model.OtpCode;
import Raidzone.model.User;
import Raidzone.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.random.RandomGenerator;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService  emailService;

    @Value("${app.otp.expiry-minutes:10}")
    private int expiryMinutes;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    /**
     * Generates a new OTP for the user and sends it via email.
     * Deletes any previous OTPs for the same user+purpose first.
     */
    @Transactional
    public void generateAndSend(User user, String purpose) {
        // Remove old codes for this user+purpose to keep the table clean
        otpRepository.deleteByUserAndPurpose(user, purpose);

        String code = String.format("%06d", RandomGenerator.getDefault().nextInt(100000, 1000000));

        OtpCode otp = new OtpCode();
        otp.setUser(user);
        otp.setCode(code);
        otp.setPurpose(purpose);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        otpRepository.save(otp);

        emailService.sendOtpEmail(user.getEmail(), user.getName(), code, purpose);
        log.info("OTP generated for user {} purpose={}", user.getEmail(), purpose);
    }

    /**
     * Like {@link #generateAndSend} but delivers the OTP to a different email address.
     * Useful for email-change flows where the code must be sent to the NEW email.
     */
    @Transactional
    public void generateAndSendTo(User user, String targetEmail, String purpose) {
        otpRepository.deleteByUserAndPurpose(user, purpose);

        String code = String.format("%06d", RandomGenerator.getDefault().nextInt(100000, 1000000));

        OtpCode otp = new OtpCode();
        otp.setUser(user);
        otp.setCode(code);
        otp.setPurpose(purpose);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        otpRepository.save(otp);

        emailService.sendOtpEmail(targetEmail, user.getName(), code, purpose);
        log.info("OTP generated for user {} purpose={} sent to {}", user.getEmail(), purpose, targetEmail);
    }

    /**
     * Verifies the OTP. Marks it as used on success.
     * Throws UnauthorizedException if invalid or expired.
     */
    @Transactional
    public void verify(User user, String code, String purpose) {
        Optional<OtpCode> found = otpRepository
                .findByUserAndCodeAndPurposeAndUsedFalseAndExpiresAtAfter(
                        user, code, purpose, LocalDateTime.now());

        if (found.isEmpty()) {
            log.warn("Invalid or expired OTP for user {} purpose={}", user.getEmail(), purpose);
            throw new UnauthorizedException("Invalid or expired verification code");
        }

        OtpCode otp = found.get();
        otp.setUsed(true);
        otpRepository.save(otp);
        log.info("OTP verified for user {} purpose={}", user.getEmail(), purpose);
    }

    /**
     * Checks if a new OTP can be sent (cooldown period has passed).
     * Returns true if resend is allowed.
     */
    @Transactional(readOnly = true)
    public boolean canResend(User user, String purpose) {
        Optional<OtpCode> last = otpRepository
                .findTopByUserAndPurposeOrderByCreatedAtDesc(user, purpose);
        if (last.isEmpty()) return true;
        LocalDateTime cooldownEnd = last.get().getCreatedAt().plusSeconds(resendCooldownSeconds);
        return LocalDateTime.now().isAfter(cooldownEnd);
    }
}
