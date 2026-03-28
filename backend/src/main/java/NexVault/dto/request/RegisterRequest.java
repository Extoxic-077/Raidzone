package NexVault.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for the user registration endpoint.
 *
 * <p>All Jakarta Validation constraints are enforced by {@code @Valid}
 * in the controller before the service layer is invoked.</p>
 */
public record RegisterRequest(

        /** The user's email address — used as the login identifier. */
        @NotBlank @Email
        String email,

        /** The user's display name. */
        @NotBlank @Size(min = 2, max = 255)
        String name,

        /** Optional mobile phone number (e.g. "+91 98765 43210"). */
        @Size(max = 20)
        String phone,

        /** Optional unique public handle / nickname. */
        @Size(min = 3, max = 100)
        String nickname,

        /** Plain-text password — will be BCrypt-hashed before storage. */
        @NotBlank @Size(min = 8, max = 100)
        String password
) {}
