package NexVault.dto.response;

import NexVault.model.Product;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only response DTO for a {@link Product} entity.
 *
 * <p>Includes a computed {@code discountPercent} field derived automatically from
 * {@code price} and {@code originalPrice}.  Null values are excluded from the
 * serialised JSON to keep the payload concise.</p>
 *
 * @param id              UUID primary key of the product
 * @param name            full display name (e.g. "Steam Wallet Card ₹500 – India")
 * @param slug            URL-safe slug used in API routes
 * @param description     marketing description; may be {@code null}
 * @param howToRedeem     numbered redemption steps; may be {@code null}
 * @param categoryId      UUID of the parent category
 * @param categoryName    display name of the parent category
 * @param brand           brand / publisher name; may be {@code null}
 * @param productType     sub-type label; may be {@code null}
 * @param region          geographic region code (e.g. "India", "Global")
 * @param emoji           unicode emoji for the product card; may be {@code null}
 * @param imageUrl        thumbnail URL; may be {@code null}
 * @param price           current selling price in INR
 * @param originalPrice   MRP / original price in INR; {@code null} when no discount
 * @param discountPercent computed discount percentage (0–100, rounded); {@code null} when no discount
 * @param avgRating       aggregate average rating (0.0–5.0)
 * @param reviewCount     total number of customer reviews
 * @param isFlashDeal     whether this product appears in the flash-deals section
 * @param badge           promotional badge label (HOT / NEW / SALE); may be {@code null}
 * @param sortOrder       display sort order within its category
 * @param createdAt       ISO-8601 timestamp of first creation
 * @param updatedAt       ISO-8601 timestamp of last update
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String howToRedeem,
        UUID categoryId,
        String categoryName,
        String brand,
        String productType,
        String region,
        String emoji,
        String imageUrl,
        BigDecimal price,
        BigDecimal originalPrice,
        Integer discountPercent,
        BigDecimal avgRating,
        Integer reviewCount,
        Boolean isFlashDeal,
        Boolean isActive,
        String badge,
        Integer sortOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Maps a {@link Product} entity to a {@code ProductResponse} DTO.
     *
     * <p>The {@code discountPercent} field is computed as
     * {@code round((originalPrice - price) / originalPrice * 100)} when
     * {@code originalPrice} is non-null and greater than {@code price}.
     * It is {@code null} otherwise.</p>
     *
     * @param product the entity to map; must not be {@code null}
     * @return a fully-populated {@code ProductResponse}
     */
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
                product.getBrand(),
                product.getProductType(),
                product.getRegion(),
                product.getEmoji(),
                product.getImageUrl(),
                product.getPrice(),
                product.getOriginalPrice(),
                discountPercent,
                product.getAvgRating(),
                product.getReviewCount(),
                product.getIsFlashDeal(),
                product.getIsActive(),
                product.getBadge(),
                product.getSortOrder(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
