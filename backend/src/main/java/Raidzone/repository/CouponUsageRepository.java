package Raidzone.repository;

import Raidzone.model.CouponUsage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, UUID> {
    boolean existsByCoupon_IdAndUser_Id(UUID couponId, UUID userId);

    List<CouponUsage> findByCoupon_IdOrderByUsedAtDesc(UUID couponId);

    long countByUsedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT cu.coupon.code, COUNT(cu), SUM(cu.discount) FROM CouponUsage cu WHERE cu.usedAt BETWEEN :from AND :to GROUP BY cu.coupon.code ORDER BY COUNT(cu) DESC")
    List<Object[]> findTopCouponsByDateRange(
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable);
}
