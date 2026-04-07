package NexVault.dto.response;

import NexVault.model.Coupon;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminCouponResponse(
    UUID id,
    String code,
    String discountType,
    BigDecimal discountValue,
    BigDecimal minOrderAmount,
    BigDecimal maxDiscount,
    int maxUses,
    int usedCount,
    Boolean isActive,
    LocalDateTime expiresAt,
    LocalDateTime createdAt
) {
    public static AdminCouponResponse from(Coupon c) {
        return new AdminCouponResponse(
            c.getId(), c.getCode(),
            c.getType() != null ? c.getType().name() : null,
            c.getValue(), c.getMinOrderAmount(), c.getMaxDiscount(),
            (int) c.getUsageLimit(), (int) c.getUsedCount(), c.getIsActive(),
            c.getExpiresAt(), c.getCreatedAt()
        );
    }
}
