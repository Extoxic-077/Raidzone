package NexVault.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA entity representing a digital product listed on HashVault.
 *
 * <p>Products belong to exactly one {@link Category} (many-to-one).  Each
 * product has a price in INR, optional original price for computing discounts,
 * and a boolean flag that marks it as a flash deal for the homepage carousel.</p>
 *
 * <p>Maps to the {@code products} table created by {@code V3__create_products.sql}.</p>
 */
@Entity
@Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class Product {

    /** Surrogate primary key, generated as a UUID v4 by the database. */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Full display name of the product (e.g. "Steam Wallet Card ₹500 – India"). */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * URL-safe slug used in API paths and canonical URLs
     * (e.g. {@code steam-wallet-500-in}).  Must be globally unique.
     */
    @Column(name = "slug", nullable = false, unique = true, length = 255)
    private String slug;

    /** Full marketing description of the product. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Step-by-step instructions for redeeming the digital code after purchase. */
    @Column(name = "how_to_redeem", columnDefinition = "TEXT")
    private String howToRedeem;

    /**
     * The category this product belongs to.  Loaded lazily to avoid N+1 queries
     * when listing large product pages.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /** Brand or publisher name (e.g. "Valve / Steam", "Riot Games"). */
    @Column(name = "brand", length = 100)
    private String brand;

    /** Product sub-type label (e.g. "Wallet Card", "In-Game Currency", "Subscription"). */
    @Column(name = "product_type", length = 100)
    private String productType;

    /**
     * Geographic region the code can be redeemed in (e.g. {@code India},
     * {@code Global}).  Defaults to {@code Global}.
     */
    @Column(name = "region", nullable = false, length = 50)
    private String region = "Global";

    /** Unicode emoji representing the product on the UI (e.g. {@code 🎮}). */
    @Column(name = "emoji", length = 10)
    private String emoji;

    /** URL of the product thumbnail image.  May be null if no image is set. */
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    /**
     * Current selling price in INR, stored with two decimal places.
     * This is always the price the customer pays.
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * Original/MRP price in INR.  When set and greater than {@code price}, the
     * frontend can compute and display a discount percentage.
     * Null when there is no active discount.
     */
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    /**
     * Aggregate average rating from customer reviews (0.0 – 5.0).
     * Stored with one decimal place.
     */
    @Column(name = "avg_rating", nullable = false, precision = 3, scale = 1)
    private BigDecimal avgRating = BigDecimal.ZERO;

    /** Total number of customer reviews contributing to {@code avgRating}. */
    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    /**
     * Whether the product is visible to shoppers.
     * Set to {@code false} to delist without deleting.
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    /**
     * Whether this product should appear in the flash-deals section.
     * Flash deals typically have a time-limited discount.
     */
    @Column(name = "is_flash_deal", nullable = false)
    private Boolean isFlashDeal = Boolean.FALSE;

    /**
     * Short promotional badge displayed on the product card
     * (allowed values: {@code HOT}, {@code NEW}, {@code SALE}).  May be null.
     */
    @Column(name = "badge", length = 20)
    private String badge;

    /**
     * Display sort order within a category.  Products are rendered in ascending
     * order of this value, then by {@code createdAt} descending.
     */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** Timestamp when this product was first created.  Set by Spring Data auditing. */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp of the last update to this product.  Maintained by Spring Data auditing. */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
