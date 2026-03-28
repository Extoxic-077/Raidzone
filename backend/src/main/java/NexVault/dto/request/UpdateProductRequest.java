package NexVault.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Admin request to partially update an existing product.
 * All fields are optional — only non-null values are applied.
 */
public record UpdateProductRequest(
        @Size(max = 255) String name,
        UUID categoryId,
        @DecimalMin("0.01") BigDecimal price,
        BigDecimal originalPrice,
        String description,
        String howToRedeem,
        @Size(max = 100) String brand,
        @Size(max = 100) String productType,
        @Size(max = 50)  String region,
        @Size(max = 10)  String emoji,
        @Size(max = 20)  String badge,
        Boolean isFlashDeal,
        Boolean isActive,
        Integer sortOrder
) {}
