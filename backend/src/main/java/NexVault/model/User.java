package NexVault.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA entity representing a registered user of the HashVault platform.
 *
 * <p>In Phase 1 this entity exists solely so that Flyway's schema validation
 * passes. Authentication and user-facing endpoints are introduced in Phase 2.</p>
 *
 * <p>Maps to the {@code users} table created by {@code V1__create_users.sql}.</p>
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class User {

    /** Surrogate primary key, generated as a UUID v4 by the database. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Unique email address used as the login identifier. */
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /** Display name of the user. */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /** Optional mobile phone number. */
    @Column(name = "phone", length = 20)
    private String phone;

    /** Optional unique public nickname / handle. */
    @Column(name = "nickname", unique = true, length = 100)
    private String nickname;

    /** Optional 6-digit Indian postal code (PIN). */
    @Column(name = "postal_code", length = 10)
    private String postalCode;

    /** Bcrypt-hashed password. Null for OAuth-only accounts. */
    @Column(name = "password_hash")
    private String passwordHash;

    /**
     * Role of the user – either {@code USER} or {@code ADMIN}.
     * Defaults to {@code USER}.
     */
    @Column(name = "role", nullable = false, length = 20)
    private String role = "USER";

    /**
     * Authentication provider – either {@code LOCAL} or an OAuth provider name
     * such as {@code GOOGLE}.  Defaults to {@code LOCAL}.
     */
    @Column(name = "provider", nullable = false, length = 20)
    private String provider = "LOCAL";

    /** Whether the user has verified their email address. */
    @Column(name = "is_email_verified", nullable = false)
    private Boolean isEmailVerified = Boolean.FALSE;

    /** Whether the account is active.  Soft-delete by setting to {@code false}. */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    /** Whether the user has opted in to marketing emails. Defaults to true. */
    @Column(name = "email_subscribed", nullable = false)
    private Boolean emailSubscribed = Boolean.TRUE;

    /** Timestamp of account creation.  Set automatically by Spring Data auditing. */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp of the last account update.  Set automatically by Spring Data auditing. */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
