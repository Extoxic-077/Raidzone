package Raidzone.service;

import Raidzone.dto.response.ProductResponse;
import Raidzone.exception.ResourceNotFoundException;
import Raidzone.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Service layer for product-related business logic.
 *
 * <p>Fetches product data from {@link ProductRepository}, enforces pagination
 * limits, maps entities to {@link ProductResponse} DTOs, and logs activity
 * at the appropriate level.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    /** Maximum number of items a caller may request in a single page. */
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductRepository productRepository;

    /**
     * Returns a paginated list of active products, optionally filtered by
     * category, minimum price, and maximum price.
     *
     * <p>When all three filter parameters are {@code null} the simple sorted
     * query is used.  When any filter is non-null the dynamic JPQL query is
     * used so that only the supplied predicates are applied.</p>
     *
     * <p>The requested {@code size} is capped at {@value MAX_PAGE_SIZE} to
     * protect against unbounded queries.</p>
     *
     * @param page       zero-based page index
     * @param size       number of items per page (capped at {@value MAX_PAGE_SIZE})
     * @param categoryId optional category UUID filter; {@code null} for all categories
     * @param minPrice   optional minimum price filter (inclusive); {@code null} for no lower bound
     * @param maxPrice   optional maximum price filter (inclusive); {@code null} for no upper bound
     * @return a {@link Page} of {@link ProductResponse} DTOs matching the criteria
     */
    public Page<ProductResponse> getAllProducts(
            int page, int size,
            UUID categoryId, String categorySlug, UUID companyId, String productType, String blueprintTag,
            BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating,
            String search, String sort) {

        int cappedSize = Math.min(size, MAX_PAGE_SIZE);
        Sort sorting = buildSort(sort);
        Pageable pageable = PageRequest.of(page, cappedSize, sorting);

        log.info("getAllProducts page={} size={} categoryId={} categorySlug={} companyId={} productType={} blueprintTag={} minPrice={} maxPrice={} minRating={} search={} sort={}",
                page, cappedSize, categoryId, categorySlug, companyId, productType, blueprintTag, minPrice, maxPrice, minRating, search, sort);

        Page<ProductResponse> result;

        if (search != null && !search.isBlank()) {
            result = productRepository
                    .searchProductsWithFilters(search.trim(), categoryId, categorySlug, companyId, productType, blueprintTag, pageable)
                    .map(ProductResponse::from);
        } else if (categoryId == null && categorySlug == null && companyId == null && productType == null && blueprintTag == null && minPrice == null && maxPrice == null && minRating == null) {
            if (sorting.equals(Sort.by(Sort.Direction.ASC, "sortOrder"))) {
                result = productRepository
                        .findByIsActiveTrueOrderBySortOrderAscCreatedAtDesc(PageRequest.of(page, cappedSize))
                        .map(ProductResponse::from);
            } else {
                result = productRepository
                        .findByFilters(null, null, null, null, null, null, null, null, pageable)
                        .map(ProductResponse::from);
            }
        } else {
            result = productRepository
                    .findByFilters(categoryId, categorySlug, companyId, productType, blueprintTag, minPrice, maxPrice, minRating, pageable)
                    .map(ProductResponse::from);
        }

        log.info("getAllProducts found {} total products (page {}/{})",
                result.getTotalElements(), result.getNumber(), result.getTotalPages());

        return result;
    }

    private Sort buildSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.ASC, "sortOrder");
        return switch (sort) {
            case "price_asc"    -> Sort.by(Sort.Direction.ASC,  "price");
            case "price_desc"   -> Sort.by(Sort.Direction.DESC, "price");
            case "rating_desc"  -> Sort.by(Sort.Direction.DESC, "avgRating");
            case "newest"       -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "popular"      -> Sort.by(Sort.Direction.DESC, "reviewCount");
            default             -> Sort.by(Sort.Direction.ASC,  "sortOrder");
        };
    }

    /**
     * Returns a single active product by its UUID primary key.
     *
     * @param id the product UUID
     * @return the matching {@link ProductResponse}
     * @throws ResourceNotFoundException if no active product with the given UUID exists
     */
    public ProductResponse getProductById(UUID id) {
        log.info("Looking up product by id: {}", id);

        return productRepository.findById(id)
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .map(ProductResponse::from)
                .orElseThrow(() -> {
                    log.warn("Product not found for id: {}", id);
                    return new ResourceNotFoundException("Product", id);
                });
    }

    /**
     * Returns a single active product by its URL-safe slug.
     *
     * @param slug the product slug (e.g. {@code "steam-wallet-500-in"})
     * @return the matching {@link ProductResponse}
     * @throws ResourceNotFoundException if no active product with the given slug exists
     */
    public ProductResponse getProductBySlug(String slug) {
        log.info("Looking up product by slug: {}", slug);

        return productRepository.findBySlugAndIsActiveTrue(slug)
                .map(ProductResponse::from)
                .orElseThrow(() -> {
                    log.warn("Product not found for slug: {}", slug);
                    return new ResourceNotFoundException("Product", slug);
                });
    }

    /**
     * Returns the top 8 most-reviewed active products for the "Featured"
     * section on the storefront homepage.
     *
     * @return list of up to 8 {@link ProductResponse} DTOs ordered by review count descending
     */
    public List<ProductResponse> getFeatured() {
        List<ProductResponse> featured = productRepository
                .findTop8ByIsActiveTrueOrderByReviewCountDesc()
                .stream()
                .map(ProductResponse::from)
                .toList();

        log.info("Fetched {} featured products", featured.size());
        return featured;
    }

    /**
     * Returns all active flash-deal products for the flash-deals section.
     *
     * @return list of {@link ProductResponse} DTOs where {@code isFlashDeal = true}
     */
    public List<ProductResponse> getFlashDeals() {
        List<ProductResponse> deals = productRepository
                .findByIsActiveTrueAndIsFlashDealTrue()
                .stream()
                .map(ProductResponse::from)
                .toList();

        log.info("Fetched {} flash-deal products", deals.size());
        return deals;
    }
}
