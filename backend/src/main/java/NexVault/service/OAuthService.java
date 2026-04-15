package NexVault.service;

import NexVault.model.User;
import NexVault.repository.UserRepository;
import NexVault.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserRepository userRepository;
    private final JwtUtil        jwtUtil;
    private final ObjectMapper   objectMapper;

    @Value("${app.oauth.google.client-id:placeholder}")
    private String googleClientId;

    @Value("${app.oauth.google.client-secret:placeholder}")
    private String googleClientSecret;

    @Value("${app.oauth.discord.client-id:placeholder}")
    private String discordClientId;

    @Value("${app.oauth.discord.client-secret:placeholder}")
    private String discordClientSecret;

    @Value("${app.oauth.redirect-base-url:http://localhost:8080}")
    private String redirectBaseUrl;

    // ── Google ────────────────────────────────────────────────────────────────

    public String buildGoogleAuthUrl(String state) {
        if ("placeholder".equals(googleClientId)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Google OAuth is not configured. Please contact administrator.");
        }
        String redirectUri = redirectBaseUrl + "/api/v1/auth/oauth/google/callback";
        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + googleClientId +
                "&redirect_uri=" + encode(redirectUri) +
                "&response_type=code" +
                "&scope=" + encode("openid email profile") +
                "&state=" + state +
                "&access_type=offline" +
                "&prompt=select_account";
    }

    @Transactional
    public OAuthResult handleGoogleCallback(String code) {
        if ("placeholder".equals(googleClientId)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Google OAuth is not configured.");
        }
        try {
            String redirectUri = redirectBaseUrl + "/api/v1/auth/oauth/google/callback";
            RestTemplate rest = new RestTemplate();

            // Exchange code for tokens
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code",          code);
            params.add("client_id",     googleClientId);
            params.add("client_secret", googleClientSecret);
            params.add("redirect_uri",  redirectUri);
            params.add("grant_type",    "authorization_code");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            ResponseEntity<String> tokenResp = rest.postForEntity(
                    "https://oauth2.googleapis.com/token",
                    new HttpEntity<>(params, headers),
                    String.class);

            JsonNode tokenJson = objectMapper.readTree(tokenResp.getBody());
            String idToken = tokenJson.path("id_token").asText();

            // Decode id_token payload (base64url, no signature check needed — came from Google)
            String[] parts   = idToken.split("\\.");
            String payload   = new String(Base64.getUrlDecoder().decode(parts[1]));
            JsonNode claims  = objectMapper.readTree(payload);

            String googleId  = claims.path("sub").asText();
            String email     = claims.path("email").asText();
            String name      = claims.path("name").asText(email.split("@")[0]);

            return findOrCreateUser(email, name, "GOOGLE", googleId);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google OAuth callback error: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to complete Google authentication: " + e.getMessage());
        }
    }

    // ── Discord ───────────────────────────────────────────────────────────────

    public String buildDiscordAuthUrl(String state) {
        if ("placeholder".equals(discordClientId)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Discord OAuth is not configured. Please contact administrator.");
        }
        String redirectUri = redirectBaseUrl + "/api/v1/auth/oauth/discord/callback";
        return "https://discord.com/api/oauth2/authorize" +
                "?client_id=" + discordClientId +
                "&redirect_uri=" + encode(redirectUri) +
                "&response_type=code" +
                "&scope=" + encode("identify email") +
                "&state=" + state;
    }

    @Transactional
    public OAuthResult handleDiscordCallback(String code) {
        if ("placeholder".equals(discordClientId)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Discord OAuth is not configured.");
        }
        try {
            String redirectUri = redirectBaseUrl + "/api/v1/auth/oauth/discord/callback";
            RestTemplate rest  = new RestTemplate();

            // Exchange code for access_token
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id",     discordClientId);
            params.add("client_secret", discordClientSecret);
            params.add("grant_type",    "authorization_code");
            params.add("code",          code);
            params.add("redirect_uri",  redirectUri);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            ResponseEntity<String> tokenResp = rest.postForEntity(
                    "https://discord.com/api/oauth2/token",
                    new HttpEntity<>(params, headers),
                    String.class);

            JsonNode tokenJson   = objectMapper.readTree(tokenResp.getBody());
            String accessToken   = tokenJson.path("access_token").asText();

            // Get user profile
            HttpHeaders authHeaders = new HttpHeaders();
            authHeaders.setBearerAuth(accessToken);
            ResponseEntity<String> userResp = rest.exchange(
                    "https://discord.com/api/users/@me",
                    HttpMethod.GET,
                    new HttpEntity<>(authHeaders),
                    String.class);

            JsonNode profile  = objectMapper.readTree(userResp.getBody());
            String discordId  = profile.path("id").asText();
            String email      = profile.path("email").asText();
            String username   = profile.path("global_name").asText(
                    profile.path("username").asText(email.split("@")[0]));

            return findOrCreateUser(email, username, "DISCORD", discordId);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Discord OAuth callback error: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to complete Discord authentication: " + e.getMessage());
        }
    }

    // ── Shared ────────────────────────────────────────────────────────────────

    private OAuthResult findOrCreateUser(String email, String name, String provider, String providerId) {
        Optional<User> existing = userRepository.findByEmail(email);
        boolean isNew;
        User user;

        if (existing.isPresent()) {
            user  = existing.get();
            isNew = false;
            // Link OAuth provider if account was LOCAL
            if ("LOCAL".equals(user.getProvider())) {
                user.setProvider(provider);
                log.info("Linked {} account to existing LOCAL user {}", provider, email);
            }
            user.setIsEmailVerified(true);
            user.setIsActive(true);
            userRepository.save(user);
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPasswordHash(null);
            user.setRole("USER");
            user.setProvider(provider);
            user.setIsEmailVerified(true);
            user.setIsActive(true);
            userRepository.save(user);
            isNew = true;
            log.info("Created new {} user: {}", provider, email);
        }

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        return new OAuthResult(accessToken, refreshToken, isNew, user.getName());
    }

    private String encode(String s) {
        try {
            return java.net.URLEncoder.encode(s, "UTF-8");
        } catch (Exception e) {
            return s;
        }
    }

    // ── Result DTO ────────────────────────────────────────────────────────────

    public record OAuthResult(
            String accessToken,
            String refreshToken,
            boolean isNewUser,
            String userName
    ) {}
}
