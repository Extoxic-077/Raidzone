package NexVault.repository;

import NexVault.model.ChatMessage;
import NexVault.model.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByThreadOrderByCreatedAtAsc(ChatThread thread);
    
    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.thread = :thread AND m.sender.id != :viewerId AND m.isRead = false")
    void markUnreadMessagesAsRead(@Param("thread") ChatThread thread, @Param("viewerId") UUID viewerId);

    long countByThreadAndIsReadFalseAndSenderIdNot(ChatThread thread, UUID viewerId);
}
