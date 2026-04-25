package Raidzone.service;

import Raidzone.dto.response.CouponApplyResponse;
import Raidzone.exception.ResourceNotFoundException;
import Raidzone.model.Coupon;
import Raidzone.model.CouponType;
import Raidzone.model.CouponUsage;
import Raidzone.model.Order;
import Raidzone.model.User;
import Raidzone.repository.CouponRepository;
import Raidzone.repository.CouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    /**
     * Validates and previews a coupon discount. Does NOT persist anything.
     * Called by the /coupons/apply endpoint and by OrderService before saving.
     */
    @Transactional(readOnly = true)
    public CouponApplyResponse validateAndPreview(String code, BigDecimal orderAmount, UUID userId) {
        // 1. Find coupon
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(code)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found", code));

        // 2. Active check (redundant with query but kept for clarity)
        if (Boolean.FALSE.equals(coupon.getIsActive())) {
            throw new IllegalStateException("This coupon is inactive");
        }

        // 3. Expiry check
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("This coupon has expired");
        }

        // 4. Usage limit check
        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new IllegalStateException("This coupon has reached its usage limit");
        }

        // 5. Minimum order amount check
        if (orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalStateException(
                    "Minimum order amount of ₹" + coupon.getMinOrderAmount().stripTrailingZeros().toPlainString()
                    + " required for this coupon");
        }

        // 6. Already used check
        if (couponUsageRepository.existsByCoupon_IdAndUser_Id(coupon.getId(), userId)) {
            throw new IllegalStateException("You have already used this coupon");
        }

        // 7. Calculate discount
        BigDecimal discount;
        if (coupon.getType() == CouponType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null) {
                discount = discount.min(coupon.getMaxDiscount());
            }
        } else {
            // FIXED — never exceed the order amount
            discount = coupon.getValue().min(orderAmount);
        }

        BigDecimal finalAmount = orderAmount.subtract(discount);

        String message = coupon.getType() == CouponType.PERCENTAGE
                ? coupon.getValue().stripTrailingZeros().toPlainString() + "% off applied"
                : "₹" + discount.stripTrailingZeros().toPlainString() + " discount applied";

        return new CouponApplyResponse(
                coupon.getCode().toUpperCase(),
                coupon.getType().name(),
                orderAmount,
                discount,
                finalAmount,
                message
        );
    }

    /**
     * Records coupon redemption after an order is saved. Must be called inside
     * the same @Transactional as the order save.
     */
    public void redeemCoupon(Coupon coupon, User user, Order order, BigDecimal discount) {
        CouponUsage usage = new CouponUsage();
        usage.setCoupon(coupon);
        usage.setUser(user);
        usage.setOrder(order);
        usage.setDiscount(discount);
        couponUsageRepository.save(usage);
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
    }
}
