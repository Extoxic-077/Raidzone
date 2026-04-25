package Raidzone.dto.response;

import java.math.BigDecimal;

public record CouponApplyResponse(
        String code,
        String discountType,
        BigDecimal originalAmount,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        String message
) {}
