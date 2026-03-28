package NexVault.repository;

import NexVault.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {

    boolean existsByUser_IdAndProduct_Id(UUID userId, UUID productId);
}
