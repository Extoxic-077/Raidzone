package Raidzone.dto.response;

import Raidzone.model.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID productId,
        String productName,
        String productEmoji,
        String imageUrl,
        BigDecimal price,
        int quantity,
        BigDecimal lineTotal,
        UUID keyId,
        Boolean isRevealed,
        Boolean hasReviewed
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProductName(),
                item.getProductEmoji(),
                item.getImageUrl(),
                item.getPrice(),
                item.getQuantity(),
                item.getLineTotal(),
                item.getDigitalKeyId(),
                null,
                null
        );
    }

    public OrderItemResponse withRevealStatus(Boolean revealed) {
        return new OrderItemResponse(
                productId, productName, productEmoji, imageUrl,
                price, quantity, lineTotal, keyId, revealed, hasReviewed
        );
    }

    public OrderItemResponse withReviewStatus(Boolean reviewed) {
        return new OrderItemResponse(
                productId, productName, productEmoji, imageUrl,
                price, quantity, lineTotal, keyId, isRevealed, reviewed
        );
    }
}
