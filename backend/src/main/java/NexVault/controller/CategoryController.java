package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.CategoryResponse;
import NexVault.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller exposing the category endpoints of the HashVault API.
 *
 * <p>All endpoints are prefixed with {@code /api/v1/categories}.  Responses are
 * always wrapped in an {@link ApiResponse} envelope for consistent client handling.</p>
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Retrieve product categories available on the HashVault storefront")
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * Returns a list of all active categories ordered by their display sort order.
     *
     * @return 200 OK with an {@link ApiResponse} wrapping a list of {@link CategoryResponse} DTOs
     */
    @GetMapping
    @Operation(
            summary     = "List all categories",
            description = "Returns all active product categories sorted by their display order."
    )
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    /**
     * Returns a single category identified by its URL-safe slug.
     *
     * @param slug the category slug (e.g. {@code gift-cards})
     * @return 200 OK with the matching {@link CategoryResponse}, or 404 if not found
     */
    @GetMapping("/{slug}")
    @Operation(
            summary     = "Get category by slug",
            description = "Returns a single active category identified by its URL-safe slug."
    )
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryBySlug(
            @Parameter(description = "URL-safe category slug, e.g. gift-cards", example = "gift-cards")
            @PathVariable String slug) {

        CategoryResponse category = categoryService.getCategoryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(category));
    }
}
