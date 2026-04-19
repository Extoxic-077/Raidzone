package NexVault.repository;

import NexVault.model.DigitalKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DigitalKeyRepository extends JpaRepository<DigitalKey, UUID> {

    @Query("SELECT k FROM DigitalKey k WHERE k.product.id = :productId AND k.status = 'AVAILABLE' ORDER BY k.addedAt ASC")
    List<DigitalKey> findAvailableByProductId(@Param("productId") UUID productId);

    long countByProductIdAndStatus(UUID productId, String status);

    @Query("""
        SELECT k FROM DigitalKey k
        JOIN k.orderItem oi
        JOIN oi.order o
        WHERE o.user.id = :userId AND k.status = 'SOLD'
        ORDER BY k.assignedAt DESC
        """)
    List<DigitalKey> findSoldKeysByUserId(@Param("userId") UUID userId);

    List<DigitalKey> findByProductIdOrderByAddedAtDesc(UUID productId);

    @Query("""
        SELECT k FROM DigitalKey k
        JOIN k.orderItem oi
        JOIN oi.order o
        WHERE k.id = :keyId AND o.user.id = :userId
        """)
    java.util.Optional<DigitalKey> findByIdAndUserId(
            @Param("keyId") UUID keyId,
            @Param("userId") UUID userId);
}
