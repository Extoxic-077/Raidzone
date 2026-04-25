package Raidzone.controller;

import Raidzone.dto.response.ApiResponse;
import Raidzone.service.OAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * OAuth2 Authorization Code Flow controller.
 *
 * <p>Stateless JWT architecture — no Spring OAuth2 Client. We implement
 * the flow manually: frontend fetches an auth URL, redirects the user,
 * provider redirects back to /callback, we exchange code for tokens,
 * issue our own JWT, and redirect the frontend to oauth-success.html.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/oauth")
@RequiredArgsConstructor
@Tag(name = "OAuth2", description = "Google and Discord social login")
public class OAuthController {

    private static final String REFRESH_COOKIE  = "refresh_token";
    private static final long   REFRESH_MAX_AGE = 7 * 24 * 60 * 60L;
    private static final String STATE_PREFIX    = "oauth:state:";

    private final OAuthService       oAuthService;
    private final StringRedisTemplate redisTemplate;

    // ── Google ────────────────────────────────────────────────────────────────

    @GetMapping("/google")
    @Operation(summary = "Get Google OAuth2 authorization URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> googleAuth() {
        String state   = UUID.randomUUID().toString();
        String authUrl = oAuthService.buildGoogleAuthUrl(state);
        // Store state in Redis for 10 min to prevent CSRF
        redisTemplate.opsForValue().set(STATE_PREFIX + state, "1", Duration.ofMinutes(10));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("authUrl", authUrl)));
    }

    @GetMapping("/google/callback")
    @Operation(summary = "Google OAuth2 callback — exchanges code for Raidzone JWT")
    public ResponseEntity<Void> googleCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        if (error != null) {
            log.warn("Google OAuth denied: {}", error);
            return redirectToFrontend(true, "Google login was cancelled");
        }

        if (state != null) {
            Boolean valid = redisTemplate.hasKey(STATE_PREFIX + state);
            if (!Boolean.TRUE.equals(valid)) {
                log.warn("Google OAuth invalid state: {}", state);
                return redirectToFrontend(true, "Invalid OAuth state");
            }
            redisTemplate.delete(STATE_PREFIX + state);
        }

        try {
            OAuthService.OAuthResult result = oAuthService.handleGoogleCallback(code);
            return buildSuccessRedirect(result);
        } catch (Exception e) {
            log.error("Google callback error: {}", e.getMessage());
            return redirectToFrontend(true, e.getMessage());
        }
    }

    // ── Discord ───────────────────────────────────────────────────────────────

    @GetMapping("/discord")
    @Operation(summary = "Get Discord OAuth2 authorization URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> discordAuth() {
        String state   = UUID.randomUUID().toString();
        String authUrl = oAuthService.buildDiscordAuthUrl(state);
        redisTemplate.opsForValue().set(STATE_PREFIX + state, "1", Duration.ofMinutes(10));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("authUrl", authUrl)));
    }

    @GetMapping("/discord/callback")
    @Operation(summary = "Discord OAuth2 callback — exchanges code for Raidzone JWT")
    public ResponseEntity<Void> discordCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        if (error != null) {
            log.warn("Discord OAuth denied: {}", error);
            return redirectToFrontend(true, "Discord login was cancelled");
        }

        if (state != null) {
            Boolean valid = redisTemplate.hasKey(STATE_PREFIX + state);
            if (!Boolean.TRUE.equals(valid)) {
                log.warn("Discord OAuth invalid state: {}", state);
                return redirectToFrontend(true, "Invalid OAuth state");
            }
            redisTemplate.delete(STATE_PREFIX + state);
        }

        try {
            OAuthService.OAuthResult result = oAuthService.handleDiscordCallback(code);
            return buildSuccessRedirect(result);
        } catch (Exception e) {
            log.error("Discord callback error: {}", e.getMessage());
            return redirectToFrontend(true, e.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ResponseEntity<Void> buildSuccessRedirect(OAuthService.OAuthResult result) {
        String location = "/oauth-success.html"
                + "?token=" + encode(result.accessToken())
                + "&new="   + result.isNewUser()
                + "&name="  + encode(result.userName());

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(REFRESH_MAX_AGE)
                .sameSite("Lax")
                .build();

        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(location))
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .build();
    }

    private ResponseEntity<Void> redirectToFrontend(boolean isError, String errorMsg) {
        String msg      = (errorMsg != null) ? errorMsg : "oauth_error";
        String location = "/oauth-success.html?error=" + encode(msg);
        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(location))
                .build();
    }

    private String encode(String s) {
        try {
            return java.net.URLEncoder.encode(s, "UTF-8");
        } catch (Exception e) {
            return s;
        }
    }
}
