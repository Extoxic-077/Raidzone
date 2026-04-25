package Raidzone.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a requested resource cannot be found in the database.
 *
 * <p>Annotated with {@code @ResponseStatus(NOT_FOUND)} so that Spring MVC
 * automatically maps it to a 404 HTTP response when it reaches the
 * {@link GlobalExceptionHandler}.</p>
 *
 * <p>Example usage:</p>
 * <pre>
 *   throw new ResourceNotFoundException("Product", "steam-wallet-500-in");
 *   // Message: "Product not found: steam-wallet-500-in"
 * </pre>
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Constructs a new {@code ResourceNotFoundException} with a descriptive message.
     *
     * @param resourceType the entity type that was not found (e.g. {@code "Product"})
     * @param identifier   the value that was looked up (UUID, slug, etc.)
     */
    public ResourceNotFoundException(String resourceType, Object identifier) {
        super(resourceType + " not found: " + identifier);
    }
}
