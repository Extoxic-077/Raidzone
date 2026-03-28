package NexVault.dto.response;

/**
 * Response body returned after a successful register or login.
 *
 * <p>The refresh token is delivered as an HttpOnly cookie by the controller
 * and is intentionally absent from this payload to prevent JavaScript access.</p>
 */
public record AuthResponse(

        /** The JWT access token to send in the {@code Authorization: Bearer} header. */
        String accessToken,

        /** Always {@code "Bearer"}. */
        String tokenType,

        /** Number of seconds until the access token expires. */
        long expiresIn,

        /** The authenticated user's public profile. */
        UserResponse user
) {}
