package NexVault.controller;

import NexVault.dto.request.LoginRequest;
import NexVault.dto.request.RegisterRequest;
import NexVault.dto.request.UpdateProfileRequest;
import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.AuthResponse;
import NexVault.dto.response.UserResponse;
import NexVault.exception.UnauthorizedException;
import NexVault.service.AuthService;
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
 * REST controller exposing authentication endpoints for HashVault.
 *
 * <p>Refresh tokens are delivered and read via an HttpOnly, SameSite=Lax cookie
 * so they are never accessible to JavaScript.  Access tokens are returned in the
 * JSON response body and stored in memory on the frontend.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Registration, login, token refresh and logout")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final long REFRESH_MAX_AGE = 7 * 24 * 60 * 60L; // 7 days in seconds

    private final AuthService authService;

    /**
     * Registers a new user account and returns an access token.
     *
     * @param request the registration payload (email, name, password, etc.)
     * @return 201 Created with access token and user profile; refresh token in cookie
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse authResponse = authService.register(request);
        String refreshToken = authService.generateRefreshToken(authResponse.user().id());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(refreshToken).toString())
                .body(ApiResponse.ok(authResponse, "Account created successfully"));
    }

    /**
     * Authenticates with email and password, returning an access token.
     *
     * @param request login credentials
     * @return 200 OK with access token; refresh token in cookie
     */
    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.login(request);
        String refreshToken = authService.generateRefreshToken(authResponse.user().id());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(refreshToken).toString())
                .body(ApiResponse.ok(authResponse, "Login successful"));
    }

    /**
     * Issues a new access token using the HttpOnly refresh token cookie.
     *
     * @param refreshToken the refresh JWT read from the {@code refresh_token} cookie
     * @return 200 OK with a new access token; rotated refresh token in cookie
     */
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

    /**
     * Clears the refresh token cookie, effectively logging the user out.
     *
     * @return 200 OK with a "Logged out" message
     */
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

    /**
     * Returns the profile of the currently authenticated user.
     *
     * @param authentication the Spring Security authentication object
     * @return 200 OK with the user's {@link UserResponse}
     */
    @GetMapping("/me")
    @Operation(summary = "Get the current authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        UserResponse user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    /**
     * Updates the authenticated user's profile (name, phone, nickname).
     *
     * @param request        the fields to update
     * @param authentication the current user's security context
     * @return 200 OK with the updated {@link UserResponse}
     */
    @PutMapping("/me")
    @Operation(summary = "Update the current user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        UserResponse user = authService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(user, "Profile updated"));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Builds a secure, HttpOnly refresh token cookie.
     *
     * @param token the refresh JWT value
     * @return a configured {@link ResponseCookie}
     */
    private ResponseCookie buildRefreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(REFRESH_MAX_AGE)
                .sameSite("Lax")
                .build();
    }
}
