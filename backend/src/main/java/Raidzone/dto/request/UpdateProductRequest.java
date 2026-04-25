package Raidzone.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateProductRequest(
        @Size(max = 255) String name,
        UUID categoryId,
        @DecimalMin("0.01") BigDecimal price,
        BigDecimal originalPrice,
        @Size(max = 2000) String description,
        String howToRedeem,
        UUID companyId,
        @Size(max = 100) String brand,
        @Size(max = 100) String productType,
        @Size(max = 50)  String region,
        @Size(max = 20)  String badge,
        String blueprintTags,
        Boolean isFlashDeal,
        Boolean isActive,
        Integer sortOrder,
        Integer stockCount
) {}
