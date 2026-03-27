package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.ProductResponse;
import NexVault.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * REST controller exposing the product endpoints of the HashVault API.
 *
 * <p>All endpoints are prefixed with {@code /api/v1/products}.  Every response
 * is wrapped in an {@link ApiResponse} envelope so the frontend can handle
 * success and error cases uniformly.</p>
 */
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Browse and filter digital products available in the HashVault marketplace")
public class ProductController {

    private final ProductService productService;

    /**
     * Returns a paginated list of all active products with optional filters.
     *
     * @param page       zero-based page index (default {@code 0})
     * @param size       number of items per page (default {@code 20}, max {@code 100})
     * @param categoryId optional UUID of the category to filter by
     * @param minPrice   optional minimum price in INR (inclusive)
     * @param maxPrice   optional maximum price in INR (inclusive)
     * @return 200 OK with a paginated {@link Page} of {@link ProductResponse} DTOs
     */
    @GetMapping
    @Operation(
            summary     = "List all products (paginated)",
            description = "Returns a paginated list of active products. " +
                          "Optionally filter by categoryId, minPrice, and/or maxPrice."
    )
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @Parameter(description = "Zero-based page index", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size (max 100)", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Filter by category UUID")
            @RequestParam(required = false) UUID categoryId,

            @Parameter(description = "Minimum price in INR (inclusive)", example = "100")
            @RequestParam(required = false) BigDecimal minPrice,

            @Parameter(description = "Maximum price in INR (inclusive)", example = "2000")
            @RequestParam(required = false) BigDecimal maxPrice) {

        Page<ProductResponse> products =
                productService.getAllProducts(page, size, categoryId, minPrice, maxPrice);
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    /**
     * Returns the top 8 most-reviewed products for the featured section.
     *
     * @return 200 OK with a list of up to 8 featured {@link ProductResponse} DTOs
     */
    @GetMapping("/featured")
    @Operation(
            summary     = "Get featured products",
            description = "Returns up to 8 products with the highest review count for the homepage featured section."
    )
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeatured() {
        List<ProductResponse> featured = productService.getFeatured();
        return ResponseEntity.ok(ApiResponse.ok(featured));
    }

    /**
     * Returns all products marked as flash deals.
     *
     * @return 200 OK with a list of {@link ProductResponse} DTOs where {@code isFlashDeal = true}
     */
    @GetMapping("/flash-deals")
    @Operation(
            summary     = "Get flash-deal products",
            description = "Returns all active products marked as flash deals for the homepage carousel."
    )
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFlashDeals() {
        List<ProductResponse> deals = productService.getFlashDeals();
        return ResponseEntity.ok(ApiResponse.ok(deals));
    }

    /**
     * Returns a single product identified by its UUID.
     *
     * @param id the product UUID
     * @return 200 OK with the matching {@link ProductResponse}, or 404 if not found
     */
    @GetMapping("/{id}")
    @Operation(
            summary     = "Get product by UUID",
            description = "Returns a single active product identified by its UUID primary key."
    )
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @Parameter(description = "Product UUID", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @PathVariable UUID id) {

        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.ok(product));
    }

    /**
     * Returns a single product identified by its URL-safe slug.
     *
     * @param slug the product slug (e.g. {@code steam-wallet-500-in})
     * @return 200 OK with the matching {@link ProductResponse}, or 404 if not found
     */
    @GetMapping("/slug/{slug}")
    @Operation(
            summary     = "Get product by slug",
            description = "Returns a single active product identified by its URL-safe slug."
    )
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(
            @Parameter(description = "URL-safe product slug", example = "steam-wallet-500-in")
            @PathVariable String slug) {

        ProductResponse product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(product));
    }
}
