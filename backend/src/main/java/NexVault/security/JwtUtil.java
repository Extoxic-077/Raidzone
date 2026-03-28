package NexVault.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Utility component for generating and validating JWT access and refresh tokens.
 *
 * <p>Uses HMAC-SHA256 (HS256) with a configurable secret key.
 * Access tokens carry {@code sub} (userId), {@code email}, and {@code role} claims.
 * Refresh tokens carry only {@code sub} (userId) to keep them minimal.</p>
 */
@Slf4j
@Component
public class JwtUtil {

    private final SecretKey signingKey;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    /**
     * Constructs the utility, deriving the HMAC key from the configured secret string.
     *
     * @param secret              raw secret value injected from {@code app.jwt.secret}
     * @param accessTokenExpiry   access token lifetime in milliseconds
     * @param refreshTokenExpiry  refresh token lifetime in milliseconds
     */
    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiry}") long accessTokenExpiry,
            @Value("${app.jwt.refresh-token-expiry}") long refreshTokenExpiry) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    /**
     * Generates a signed JWT access token containing userId, email, and role.
     *
     * @param userId the user's UUID
     * @param email  the user's email address
     * @param role   the user's role (e.g. "USER" or "ADMIN")
     * @return signed JWT string
     */
    public String generateAccessToken(UUID userId, String email, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date(now))
                .expiration(new Date(now + accessTokenExpiry))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generates a signed JWT refresh token with only the userId as subject.
     *
     * @param userId the user's UUID
     * @return signed JWT string with longer expiry
     */
    public String generateRefreshToken(UUID userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date(now))
                .expiration(new Date(now + refreshTokenExpiry))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validates and parses a JWT token, returning the claims payload.
     *
     * @param token the raw JWT string
     * @return the parsed {@link Claims} if the token is valid and not expired
     * @throws io.jsonwebtoken.JwtException if the token is malformed, expired, or has an invalid signature
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts the user UUID from a token's subject claim.
     *
     * @param token the raw JWT string
     * @return the user's {@link UUID}
     */
    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(validateToken(token).getSubject());
    }

    /**
     * Extracts the role claim from a token.
     *
     * @param token the raw JWT string
     * @return the role string (e.g. "USER" or "ADMIN"), or {@code null} if absent
     */
    public String getRoleFromToken(String token) {
        return validateToken(token).get("role", String.class);
    }

    /**
     * Returns the configured access token expiry in milliseconds.
     *
     * @return access token expiry duration in ms
     */
    public long getAccessTokenExpiry() {
        return accessTokenExpiry;
    }
}
