package Raidzone.controller;

import Raidzone.dto.request.ChatMessageRequest;
import Raidzone.dto.response.ApiResponse;
import Raidzone.dto.response.ChatMessageResponse;
import Raidzone.dto.response.ChatThreadResponse;
import Raidzone.model.ChatThread;
import Raidzone.service.ChatService;
import Raidzone.service.DiscordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Realtime Customer Support Chat")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {

    private final ChatService chatService;
    private final DiscordService discordService;

    /** Payload sent by the Discord bot when a support agent replies in Discord */
    public record DiscordReplyRequest(String botSecret, String threadId, String content) {}

    @GetMapping("/my-thread")
    @Operation(summary = "Get or create current user's chat thread")
    public ResponseEntity<ApiResponse<ChatThreadResponse>> getMyThread(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        ChatThread thread = chatService.getOrCreateMyThread(userId);
        return ResponseEntity.ok(ApiResponse.ok(ChatThreadResponse.from(thread, 0)));
    }

    @GetMapping("/threads/{threadId}/messages")
    @Operation(summary = "Get message history for a thread")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable UUID threadId, Authentication auth) {
        UUID viewerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(chatService.getThreadMessages(threadId, viewerId)));
    }

    @PostMapping("/threads/{threadId}/read")
    @Operation(summary = "Mark messages in thread as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID threadId, Authentication auth) {
        UUID viewerId = (UUID) auth.getPrincipal();
        chatService.markThreadRead(threadId, viewerId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Admin Endpoints ──

    @GetMapping("/admin/threads")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all active chat threads for admin")
    public ResponseEntity<ApiResponse<List<ChatThreadResponse>>> getAdminThreads(Authentication auth) {
        UUID adminId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(chatService.getAllAdminThreads(adminId)));
    }

    // ── WebSocket Intercept ──

    // This handles messages sent via STOMP: stompClient.send("/app/chat/{threadId}")
    @MessageMapping("/chat/{threadId}")
    public void handleIncomingMessage(
            @DestinationVariable UUID threadId,
            @Valid ChatMessageRequest message,
            Principal principal) {
        
        // STOMP Principal with our Jwt interceptor setup usually gives string UUID name
        UUID senderId = UUID.fromString(principal.getName());
        chatService.sendMessage(threadId, senderId, message);
    }
    // ── Discord Bot Reply Webhook ──

    /**
     * Called by the Discord bot when a support agent replies in Discord.
     * Secured via shared bot secret — NOT a JWT endpoint.
     */
    @PostMapping("/discord-reply")
    public ResponseEntity<ApiResponse<Void>> discordReply(@RequestBody DiscordReplyRequest req) {
        if (!discordService.isValidBotSecret(req.botSecret())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Invalid bot secret"));
        }
        UUID threadId = UUID.fromString(req.threadId());
        chatService.sendDiscordReply(threadId, req.content());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
