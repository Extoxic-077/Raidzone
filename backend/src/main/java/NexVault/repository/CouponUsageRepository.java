package NexVault.repository;

import NexVault.model.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, UUID> {
    boolean existsByCoupon_IdAndUser_Id(UUID couponId, UUID userId);
}
