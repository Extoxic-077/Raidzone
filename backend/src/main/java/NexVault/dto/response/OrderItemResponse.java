package NexVault.dto.response;

import NexVault.model.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID productId,
        String productName,
        String productEmoji,
        String imageUrl,
        BigDecimal price,
        int quantity,
        BigDecimal lineTotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProductName(),
                item.getProductEmoji(),
                item.getImageUrl(),
                item.getPrice(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }
}
