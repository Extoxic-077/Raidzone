package Raidzone.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an authentication or authorisation check fails.
 *
 * <p>Examples: invalid credentials, expired token, inactive account.
 * Maps to HTTP 401 Unauthorized.</p>
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {

    /**
     * Constructs the exception with a descriptive message.
     *
     * @param message human-readable reason for the auth failure
     */
    public UnauthorizedException(String message) {
        super(message);
    }
}
