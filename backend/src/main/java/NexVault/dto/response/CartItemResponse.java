package NexVault.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Represents a single line item in the user's shopping cart.
 */
public record CartItemResponse(
        UUID productId,
        String name,
        String imageUrl,
        String imageEmoji,
        BigDecimal price,
        BigDecimal originalPrice,
        int quantity,
        BigDecimal lineTotal,
        boolean isAvailable
) {}
