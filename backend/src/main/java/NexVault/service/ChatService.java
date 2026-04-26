package NexVault.service;

import NexVault.dto.request.ChatMessageRequest;
import NexVault.dto.response.ChatMessageResponse;
import NexVault.dto.response.ChatThreadResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.ChatMessage;
import NexVault.model.ChatThread;
import NexVault.model.User;
import NexVault.repository.ChatMessageRepository;
import NexVault.repository.ChatThreadRepository;
import NexVault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final DiscordService discordService;

    @Transactional
    public ChatThread getOrCreateMyThread(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return threadRepository.findByUser(user)
                .orElseGet(() -> {
                    ChatThread t = new ChatThread();
                    t.setUser(user);
                    return threadRepository.save(t);
                });
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getThreadMessages(UUID threadId, UUID viewerId) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread", threadId));
        return messageRepository.findByThreadOrderByCreatedAtAsc(thread).stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendMessage(UUID threadId, UUID senderId, ChatMessageRequest req) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread", threadId));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender", senderId));

        ChatMessage msg = new ChatMessage();
        msg.setThread(thread);
        msg.setSender(sender);
        msg.setContent(req.content());
        msg = messageRepository.save(msg);

        // Update thread status
        if ("ADMIN".equals(sender.getRole())) {
            thread.setStatus("WAITING_ON_USER");
        } else {
            thread.setStatus("WAITING_ON_ADMIN");
        }
        threadRepository.save(thread);

        ChatMessageResponse resp = ChatMessageResponse.from(msg);

        // STOMP WebSocket broadcast
        messagingTemplate.convertAndSend("/topic/chat/" + thread.getId(), resp);
        messagingTemplate.convertAndSend("/topic/chat/admin", resp);

        // Forward to Discord only for user-sent messages (not admin replies)
        if (!"ADMIN".equals(sender.getRole())) {
            discordService.forwardToDiscord(
                    thread.getId().toString(),
                    sender.getName(),
                    req.content()
            );
        }

        return resp;
    }

    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getAllAdminThreads(UUID adminId) {
        return threadRepository.findAllByOrderByUpdatedAtDesc().stream().map(t -> {
            long unread = messageRepository.countByThreadAndIsReadFalseAndSenderIdNot(t, adminId);
            return ChatThreadResponse.from(t, unread);
        }).collect(Collectors.toList());
    }

    @Transactional
    public void markThreadRead(UUID threadId, UUID viewerId) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread", threadId));
        messageRepository.markUnreadMessagesAsRead(thread, viewerId);
    }

    /**
     * Called by the Discord bot endpoint — posts an admin reply from Discord back into the chat.
     * Finds the first admin user in the system to act as sender.
     */
    @Transactional
    public void sendDiscordReply(UUID threadId, String content) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread", threadId));

        // Use the thread's linked admin or fall back to first ADMIN user
        User admin = userRepository.findFirstByRole("ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "first"));

        ChatMessage msg = new ChatMessage();
        msg.setThread(thread);
        msg.setSender(admin);
        msg.setContent(content);
        msg = messageRepository.save(msg);

        thread.setStatus("WAITING_ON_USER");
        threadRepository.save(thread);

        ChatMessageResponse resp = ChatMessageResponse.from(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + thread.getId(), resp);
        messagingTemplate.convertAndSend("/topic/chat/admin", resp);
        log.info("[Discord] Reply posted to thread {}", threadId);
    }
}

