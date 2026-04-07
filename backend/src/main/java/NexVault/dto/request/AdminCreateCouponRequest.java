package NexVault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdminCreateCouponRequest(
    @NotBlank String code,
    @NotBlank String discountType,
    @NotNull BigDecimal discountValue,
    BigDecimal minOrderAmount,
    BigDecimal maxDiscount,
    Integer maxUses,
    String expiresAt
) {}
