package Raidzone.dto.response;

import Raidzone.model.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminOrderDetailResponse(
    UUID id,
    String status,
    String shippingName,
    String shippingEmail,
    String shippingPhone,
    String shippingAddress,
    BigDecimal totalAmount,
    BigDecimal discountAmount,
    String couponCode,
    String paymentMethod,
    LocalDateTime paidAt,
    int totalItems,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<OrderItemResponse> items,
    AdminPaymentResponse payment
) {
    public static AdminOrderDetailResponse from(Order o, AdminPaymentResponse payment) {
        List<OrderItemResponse> items = o.getItems() == null ? List.of() :
            o.getItems().stream().map(OrderItemResponse::from).toList();
        return new AdminOrderDetailResponse(
            o.getId(), o.getStatus(), o.getShippingName(), o.getShippingEmail(),
            o.getShippingPhone(), o.getShippingAddress(), o.getTotalAmount(),
            o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO,
            o.getCouponCode(), o.getPaymentMethod(), o.getPaidAt(),
            (int) o.getTotalItems(),
            o.getCreatedAt(), o.getUpdatedAt(), items, payment
        );
    }
}
