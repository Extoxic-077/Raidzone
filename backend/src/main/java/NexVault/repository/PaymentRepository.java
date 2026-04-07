package NexVault.repository;

import NexVault.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByStripePaymentIntentId(String intentId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByCoinbaseChargeId(String chargeId);

    @Query(value = "SELECT * FROM payments WHERE " +
           "(CAST(:provider AS varchar) IS NULL OR provider = :provider) AND " +
           "(CAST(:status AS varchar) IS NULL OR status = :status) " +
           "ORDER BY created_at DESC",
           countQuery = "SELECT COUNT(*) FROM payments WHERE " +
           "(CAST(:provider AS varchar) IS NULL OR provider = :provider) AND " +
           "(CAST(:status AS varchar) IS NULL OR status = :status)",
           nativeQuery = true)
    Page<Payment> findAllAdmin(
        @Param("provider") String provider,
        @Param("status") String status,
        Pageable pageable);

    Optional<Payment> findByOrder_Id(UUID orderId);
}
