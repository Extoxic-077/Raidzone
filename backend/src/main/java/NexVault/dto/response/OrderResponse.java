package NexVault.dto.response;

import NexVault.model.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String status,
        BigDecimal totalAmount,
        BigDecimal discountAmount,
        String couponCode,
        String paymentMethod,
        LocalDateTime paidAt,
        int totalItems,
        String shippingName,
        String shippingEmail,
        String shippingPhone,
        String shippingAddress,
        List<OrderItemResponse> items,
        LocalDateTime createdAt
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getDiscountAmount(),
                order.getCouponCode(),
                order.getPaymentMethod(),
                order.getPaidAt(),
                order.getTotalItems(),
                order.getShippingName(),
                order.getShippingEmail(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getItems().stream().map(OrderItemResponse::from).toList(),
                order.getCreatedAt()
        );
    }
}
