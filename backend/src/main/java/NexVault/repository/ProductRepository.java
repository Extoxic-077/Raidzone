package NexVault.repository;

import NexVault.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link Product} entities.
 *
 * <p>Provides all standard CRUD operations via {@link JpaRepository} plus
 * custom queries for the five product-listing use-cases in Phase 1.</p>
 */
public interface ProductRepository extends JpaRepository<Product, UUID> {

    /**
     * Returns a paginated list of all active products ordered by
     * {@code sortOrder} ascending then {@code createdAt} descending.
     *
     * @param pageable pagination and sorting parameters
     * @return a {@link Page} of active products
     */
    Page<Product> findByIsActiveTrueOrderBySortOrderAscCreatedAtDesc(Pageable pageable);

    /**
     * Returns a paginated list of active products that belong to a specific category.
     *
     * @param categoryId the UUID of the parent category
     * @param pageable   pagination parameters
     * @return a {@link Page} of active products in the given category
     */
    Page<Product> findByIsActiveTrueAndCategory_IdOrderBySortOrderAscCreatedAtDesc(
            UUID categoryId, Pageable pageable);

    /**
     * Looks up a single active product by its URL-safe slug.
     *
     * @param slug the slug to search for (e.g. {@code "steam-wallet-500-in"})
     * @return an {@link Optional} containing the matching product, or
     *         {@link Optional#empty()} if no active product with that slug exists
     */
    Optional<Product> findBySlugAndIsActiveTrue(String slug);

    /**
     * Returns all active flash-deal products in no guaranteed order.
     *
     * @return list of active flash-deal products; empty if none are flagged
     */
    List<Product> findByIsActiveTrueAndIsFlashDealTrue();

    /**
     * Returns the top 8 active products ordered by {@code reviewCount} descending,
     * used to populate the "Featured" section on the storefront.
     *
     * @return list of up to 8 most-reviewed active products
     */
    List<Product> findTop8ByIsActiveTrueOrderByReviewCountDesc();

    /**
     * Dynamic filter query that accepts optional {@code categoryId}, {@code minPrice},
     * and {@code maxPrice} parameters.  A {@code null} value for any parameter means
     * "no restriction on that field".
     *
     * <p>The {@code IS NULL OR} pattern in the JPQL ensures that when a parameter is
     * passed as {@code null}, the condition evaluates to {@code true} for all rows,
     * effectively ignoring that filter.</p>
     *
     * @param categoryId the UUID of the category to filter by, or {@code null} to include all
     * @param minPrice   the minimum price (inclusive), or {@code null} for no lower bound
     * @param maxPrice   the maximum price (inclusive), or {@code null} for no upper bound
     * @param pageable   pagination and sorting parameters
     * @return a {@link Page} of products matching all supplied filters
     */
    long countByIsActiveTrue();

    /**
     * Full-text search across product name, description, brand, and category name.
     * Accepts an optional categoryId filter alongside the search term.
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.isActive = true
              AND (:categoryId IS NULL
                   OR p.category.id = :categoryId
                   OR p.category.parent.id = :categoryId)
              AND (:companyId  IS NULL OR p.company.id = :companyId)
              AND (:minPrice   IS NULL OR p.price >= :minPrice)
              AND (:maxPrice   IS NULL OR p.price <= :maxPrice)
              AND (:minRating  IS NULL OR p.avgRating >= :minRating)
            ORDER BY p.sortOrder ASC, p.createdAt DESC
            """)
    Page<Product> findByFilters(
            @Param("categoryId") UUID categoryId,
            @Param("companyId")  UUID companyId,
            @Param("minPrice")   BigDecimal minPrice,
            @Param("maxPrice")   BigDecimal maxPrice,
            @Param("minRating")  BigDecimal minRating,
            Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.isActive = true
              AND (:categoryId IS NULL
                   OR p.category.id = :categoryId
                   OR p.category.parent.id = :categoryId)
              AND (:companyId  IS NULL OR p.company.id = :companyId)
              AND (
                LOWER(p.name)        LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(p.brand)    LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """)
    Page<Product> searchProductsWithFilters(
            @Param("query")      String query,
            @Param("categoryId") UUID categoryId,
            @Param("companyId")  UUID companyId,
            Pageable pageable);
}
