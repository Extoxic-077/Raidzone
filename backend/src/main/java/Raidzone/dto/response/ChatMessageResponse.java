package Raidzone.dto.response;

import Raidzone.model.ChatMessage;
import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        UUID threadId,
        UUID senderId,
        String senderName,
        boolean isAdmin,
        String content,
        LocalDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage msg) {
        return new ChatMessageResponse(
                msg.getId(),
                msg.getThread().getId(),
                msg.getSender().getId(),
                msg.getSender().getName(),
                "ADMIN".equals(msg.getSender().getRole()),
                msg.getContent(),
                msg.getCreatedAt()
        );
    }
}
