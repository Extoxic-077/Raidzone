package NexVault.repository;

import NexVault.model.ChatThread;
import NexVault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {
    Optional<ChatThread> findByUser(User user);
    
    // For admin to list active threads (oldest updated first, perhaps, or newest)
    List<ChatThread> findAllByOrderByUpdatedAtDesc();
}
