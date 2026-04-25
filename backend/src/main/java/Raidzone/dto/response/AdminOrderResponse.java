package Raidzone.dto.response;

import Raidzone.model.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminOrderResponse(
    UUID id,
    String status,
    String shippingName,
    String shippingEmail,
    String shippingPhone,
    BigDecimal totalAmount,
    BigDecimal discountAmount,
    String couponCode,
    String paymentMethod,
    LocalDateTime paidAt,
    int totalItems,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AdminOrderResponse from(Order o) {
        return new AdminOrderResponse(
            o.getId(), o.getStatus(), o.getShippingName(), o.getShippingEmail(),
            o.getShippingPhone(), o.getTotalAmount(),
            o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO,
            o.getCouponCode(), o.getPaymentMethod(), o.getPaidAt(),
            (int) o.getTotalItems(),
            o.getCreatedAt(), o.getUpdatedAt()
        );
    }
}
