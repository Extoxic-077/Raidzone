package NexVault.dto.response;

import NexVault.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Public-facing representation of a {@link User} entity.
 *
 * <p>Omits sensitive fields (passwordHash) and maps camelCase
 * field names for consistent JSON serialisation.</p>
 */
public record UserResponse(
        UUID id,
        String email,
        String name,
        String phone,
        String nickname,
        String role,
        String provider,
        Boolean isEmailVerified,
        LocalDateTime createdAt
) {

    /**
     * Maps a {@link User} entity to a {@link UserResponse} DTO.
     *
     * @param user the entity to convert
     * @return a new {@link UserResponse} with all safe fields populated
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPhone(),
                user.getNickname(),
                user.getRole(),
                user.getProvider(),
                user.getIsEmailVerified(),
                user.getCreatedAt()
        );
    }
}
