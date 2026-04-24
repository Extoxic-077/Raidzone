package NexVault.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponse(
        UUID productId,
        String name,
        String imageUrl,
        BigDecimal price,
        BigDecimal originalPrice,
        int quantity,
        BigDecimal lineTotal,
        boolean isAvailable
) {}
