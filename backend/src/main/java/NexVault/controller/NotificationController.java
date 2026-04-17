package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.NotificationResponse;
import NexVault.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification management")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get all notifications for the authenticated user (max 50)")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getNotifications(userId)));
    }

    @GetMapping("/count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "All notifications marked as read"));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID id, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Notification marked as read"));
    }
}
