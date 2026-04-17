package NexVault.controller;

import NexVault.dto.request.*;
import NexVault.dto.response.*;
import NexVault.exception.DuplicateResourceException;
import NexVault.exception.UnauthorizedException;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import NexVault.model.User;
import NexVault.service.AuthService;
import NexVault.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Authentication controller with OTP-based two-step login.
 *
 * <p>Login flow:
 * <ol>
 *   <li>POST /auth/login — validate credentials, send OTP email, return masked email</li>
 *   <li>POST /auth/verify-otp — verify OTP, issue JWT access token + refresh cookie</li>
 * </ol>
 *
 * <p>Register flow:
 * <ol>
 *   <li>POST /auth/register — create account, send verification OTP</li>
 *   <li>POST /auth/verify-email — verify OTP, mark email as verified, issue JWT</li>
 * </ol>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Registration, OTP login, token refresh and logout")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final long   REFRESH_MAX_AGE = 7 * 24 * 60 * 60L;

    private final AuthService authService;
    private final OtpService  otpService;

    // ── Register ──────────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new user account — sends email OTP for verification")
    public ResponseEntity<ApiResponse<LoginStep1Response>> register(
            @Valid @RequestBody RegisterRequest request) {

        User user;
        try {
            authService.register(request);
            user = authService.findActiveUserByEmail(request.email());
        } catch (DuplicateResourceException e) {
            // If email exists but not yet verified, resend OTP instead of rejecting
            user = authService.findByEmail(request.email())
                    .filter(u -> !Boolean.TRUE.equals(u.getIsEmailVerified()))
                    .orElseThrow(() -> e);
        }

        otpService.generateAndSend(user, "REGISTER");

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(LoginStep1Response.of(request.email()),
                        "Account created! Check your email for a verification code."));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email OTP after registration — issues JWT on success")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @Valid @RequestBody VerifyOtpRequest request) {

        User user = authService.findActiveUserByEmail(request.email());
        otpService.verify(user, request.otpCode(), "REGISTER");
        authService.markEmailVerified(user);

        AuthResponse authResponse = authService.buildAuthResponsePublic(user);
        String refreshToken = authService.generateRefreshToken(user.getId());

        log.info("Email verified and user logged in: {}", user.getEmail());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(refreshToken).toString())
                .body(ApiResponse.ok(authResponse, "Email verified! Welcome to NexVault."));
    }

    // ── Login — Step 1 (credentials) ─────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Step 1: Validate credentials, send OTP to email")
    public ResponseEntity<ApiResponse<LoginStep1Response>> login(
            @Valid @RequestBody LoginStep1Request request) {

        User user = authService.validateCredentials(request.email(), request.password());
        otpService.generateAndSend(user, "LOGIN");

        return ResponseEntity.ok(ApiResponse.ok(
                LoginStep1Response.of(request.email()),
                "Verification code sent to your email"));
    }

    // ── Login — Step 2 (OTP verify) ───────────────────────────────────────────

    @PostMapping("/verify-otp")
    @Operation(summary = "Step 2: Verify OTP and receive access token")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {

        User user = authService.findActiveUserByEmail(request.email());
        otpService.verify(user, request.otpCode(), "LOGIN");

        AuthResponse authResponse = authService.buildAuthResponsePublic(user);
        String refreshToken = authService.generateRefreshToken(user.getId());

        log.info("User completed OTP login: {}", user.getEmail());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(refreshToken).toString())
                .body(ApiResponse.ok(authResponse, "Login successful"));
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP (rate limited to once per 60 seconds)")
    public ResponseEntity<ApiResponse<LoginStep1Response>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request) {

        User user = authService.findActiveUserByEmail(request.email());

        if (!otpService.canResend(user, "LOGIN")) {
            throw new UnauthorizedException("Please wait before requesting a new code");
        }

        otpService.generateAndSend(user, "LOGIN");
        return ResponseEntity.ok(ApiResponse.ok(
                LoginStep1Response.of(request.email()),
                "New verification code sent"));
    }

    // ── Token refresh ─────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    @Operation(summary = "Refresh the access token using the refresh cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("No refresh token provided");
        }

        AuthResponse authResponse = authService.refreshToken(refreshToken);
        String newRefreshToken = authService.generateRefreshToken(authResponse.user().id());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefreshToken).toString())
                .body(ApiResponse.ok(authResponse, "Token refreshed"));
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    @Operation(summary = "Logout and clear the refresh token cookie")
    public ResponseEntity<ApiResponse<Void>> logout() {
        ResponseCookie clearCookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(ApiResponse.ok(null, "Logged out successfully"));
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @Operation(summary = "Get the current authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        UserResponse user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping("/me")
    @Operation(summary = "Update the current user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        UserResponse user = authService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(user, "Profile updated"));
    }

    // ── Email change ──────────────────────────────────────────────────────────

    @PostMapping("/request-email-change")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Step 1 of email change: send OTP to the new email address")
    public ResponseEntity<ApiResponse<LoginStep1Response>> requestEmailChange(
            @Valid @RequestBody ChangeEmailRequest request,
            Authentication authentication) {

        UUID userId = (UUID) authentication.getPrincipal();
        User user = authService.prepareEmailChange(userId, request.newEmail());
        otpService.generateAndSendTo(user, request.newEmail(), "EMAIL_CHANGE");

        return ResponseEntity.ok(ApiResponse.ok(
                LoginStep1Response.of(request.newEmail()),
                "Verification code sent to your new email address"));
    }

    @PostMapping("/verify-email-change")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Step 2 of email change: verify OTP and apply new email")
    public ResponseEntity<ApiResponse<UserResponse>> verifyEmailChange(
            @Valid @RequestBody VerifyEmailChangeRequest request,
            Authentication authentication) {

        UUID userId = (UUID) authentication.getPrincipal();
        User user = authService.findUserById(userId);
        otpService.verify(user, request.otpCode(), "EMAIL_CHANGE");
        UserResponse updated = authService.verifyEmailChange(userId, request.newEmail());
        return ResponseEntity.ok(ApiResponse.ok(updated, "Email updated successfully"));
    }

    // ── Password change ───────────────────────────────────────────────────────

    @PostMapping("/request-password-change")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Step 1 of password change: send OTP to current email")
    public ResponseEntity<ApiResponse<LoginStep1Response>> requestPasswordChange(
            Authentication authentication) {

        UUID userId = (UUID) authentication.getPrincipal();
        User user = authService.findUserById(userId);
        otpService.generateAndSend(user, "PASSWORD_CHANGE");

        return ResponseEntity.ok(ApiResponse.ok(
                LoginStep1Response.of(user.getEmail()),
                "Verification code sent to your email"));
    }

    @PostMapping("/verify-password-change")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Step 2 of password change: verify OTP and apply new password")
    public ResponseEntity<ApiResponse<Void>> verifyPasswordChange(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        UUID userId = (UUID) authentication.getPrincipal();
        User user = authService.findUserById(userId);
        otpService.verify(user, request.otpCode(), "PASSWORD_CHANGE");
        authService.changePassword(userId, request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null, "Password changed successfully"));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(REFRESH_MAX_AGE)
                .sameSite("Lax")
                .build();
    }
}
