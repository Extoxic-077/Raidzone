package NexVault.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull UUID categoryId,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        BigDecimal originalPrice,
        @Size(max = 2000) String description,
        String howToRedeem,
        UUID companyId,
        @Size(max = 100) String brand,
        @Size(max = 100) String productType,
        @Size(max = 50)  String region,
        @Size(max = 20)  String badge,
        boolean isFlashDeal,
        int sortOrder
) {}
