package NexVault.dto.response;

import NexVault.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String name,
        String phone,
        String nickname,
        String role,
        String provider,
        Boolean isEmailVerified,
        Boolean isActive,
        LocalDateTime createdAt
) {

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
                user.getIsActive(),
                user.getCreatedAt()
        );
    }
}
