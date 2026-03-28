package NexVault.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Request to update the authenticated user's profile fields.
 * All fields are optional.
 */
public record UpdateProfileRequest(
        @Size(min = 2, max = 255) String name,
        @Size(max = 20)           String phone,
        @Size(min = 3, max = 100) String nickname
) {}
