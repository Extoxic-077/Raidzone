package Raidzone.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for the login endpoint.
 */
public record LoginRequest(

        /** The registered email address. */
        @NotBlank @Email
        String email,

        /** The plain-text password to verify against the stored hash. */
        @NotBlank
        String password
) {}
