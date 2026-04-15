package NexVault.repository;

import NexVault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link User} entities.
 *
 * <p>Provides standard CRUD operations plus domain-specific finders
 * used during authentication and duplicate-check flows.</p>
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Finds an active user by their email address.
     */
    Optional<User> findByEmailAndIsActiveTrue(String email);

    /**
     * Finds a user by email regardless of active status (for OAuth linking).
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks whether any user (active or inactive) holds the given email.
     */
    boolean existsByEmail(String email);

    /**
     * Checks whether any user holds the given nickname.
     */
    boolean existsByNickname(String nickname);

    /**
     * Count users registered in a given date range.
     */
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}
