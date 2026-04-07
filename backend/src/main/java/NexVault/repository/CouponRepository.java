package NexVault.repository;

import NexVault.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    Optional<Coupon> findByCodeIgnoreCaseAndIsActiveTrue(String code);

    List<Coupon> findAllByOrderByCreatedAtDesc();

    Optional<Coupon> findByCode(String code);
}
