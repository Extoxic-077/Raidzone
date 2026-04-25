package NexVault.dto.response;

import NexVault.model.ChatThread;
import java.time.LocalDateTime;
import java.util.UUID;

public record ChatThreadResponse(
        UUID id,
        UUID userId,
        String userName,
        String status,
        long unreadCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ChatThreadResponse from(ChatThread thread, long unreadCount) {
        return new ChatThreadResponse(
                thread.getId(),
                thread.getUser().getId(),
                thread.getUser().getName(),
                thread.getStatus(),
                unreadCount,
                thread.getCreatedAt(),
                thread.getUpdatedAt()
        );
    }
}
