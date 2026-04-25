package Raidzone.dto.response;

import Raidzone.model.Notification;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        boolean isRead,
        LocalDateTime createdAt,
        String metadata
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(), n.getMessage(),
                n.isRead(), n.getCreatedAt(), n.getMetadata());
    }
}
