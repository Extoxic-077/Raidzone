package Raidzone.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a create/update operation would violate a uniqueness constraint.
 *
 * <p>Example: registering with an email address that is already in use.</p>
 * Maps to HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateResourceException extends RuntimeException {

    /**
     * Constructs the exception with a human-readable conflict message.
     *
     * @param resource the entity type (e.g. "User")
     * @param field    the field that must be unique (e.g. "email")
     * @param value    the conflicting value (e.g. "user@example.com")
     */
    public DuplicateResourceException(String resource, String field, String value) {
        super(resource + " with " + field + " '" + value + "' already exists");
    }
}
