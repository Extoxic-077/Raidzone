package NexVault.repository;

import NexVault.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByStripePaymentIntentId(String intentId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByCoinbaseChargeId(String chargeId);

    @Query("""
        SELECT p FROM Payment p
        LEFT JOIN FETCH p.order o
        WHERE (:provider IS NULL OR CAST(p.provider AS string) = :provider)
          AND (:status   IS NULL OR CAST(p.status   AS string) = :status)
        ORDER BY p.createdAt DESC
        """)
    List<Payment> findAllAdminEager(
        @Param("provider") String provider,
        @Param("status") String status);

    @Query(value = "SELECT COUNT(*) FROM payments WHERE " +
           "(CAST(:provider AS varchar) IS NULL OR provider = :provider) AND " +
           "(CAST(:status AS varchar) IS NULL OR status = :status)",
           nativeQuery = true)
    long countAdmin(
        @Param("provider") String provider,
        @Param("status") String status);

    Optional<Payment> findByOrder_Id(UUID orderId);
}
