package NexVault.dto.response;

import NexVault.model.Product;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String howToRedeem,
        UUID categoryId,
        String categoryName,
        UUID companyId,
        String companyName,
        String companyLogoUrl,
        String brand,
        String productType,
        String region,
        String imageUrl,
        BigDecimal price,
        BigDecimal originalPrice,
        Integer discountPercent,
        BigDecimal avgRating,
        Integer reviewCount,
        Boolean isFlashDeal,
        Boolean isActive,
        String badge,
        String blueprintTags,
        Integer sortOrder,
        Integer stockCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ProductResponse from(Product product) {
        Integer discountPercent = null;
        if (product.getOriginalPrice() != null
                && product.getOriginalPrice().compareTo(product.getPrice()) > 0) {
            BigDecimal discount = product.getOriginalPrice()
                    .subtract(product.getPrice())
                    .divide(product.getOriginalPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP);
            discountPercent = discount.intValue();
        }

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getHowToRedeem(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getCompany() != null ? product.getCompany().getId() : null,
                product.getCompany() != null ? product.getCompany().getName() : null,
                product.getCompany() != null ? product.getCompany().getLogoUrl() : null,
                product.getBrand(),
                product.getProductType(),
                product.getRegion(),
                product.getImageUrl(),
                product.getPrice(),
                product.getOriginalPrice(),
                discountPercent,
                product.getAvgRating(),
                product.getReviewCount(),
                product.getIsFlashDeal(),
                product.getIsActive(),
                product.getBadge(),
                product.getBlueprintTags(),
                product.getSortOrder(),
                product.getStockCount(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
