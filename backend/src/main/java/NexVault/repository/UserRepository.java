package NexVault.repository;

import NexVault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

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
     *
     * @param email the email to look up
     * @return an {@link Optional} containing the user if found and active, empty otherwise
     */
    Optional<User> findByEmailAndIsActiveTrue(String email);

    /**
     * Checks whether any user (active or inactive) holds the given email.
     *
     * @param email the email to check
     * @return {@code true} if the email is already registered
     */
    boolean existsByEmail(String email);

    /**
     * Checks whether any user holds the given nickname.
     *
     * @param nickname the nickname to check
     * @return {@code true} if the nickname is already taken
     */
    boolean existsByNickname(String nickname);
}
