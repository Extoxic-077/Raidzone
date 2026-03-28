package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.ProductResponse;
import NexVault.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST endpoints for the authenticated user's wishlist.
 */
@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Saved products (requires authentication)")
@SecurityRequirement(name = "bearerAuth")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @Operation(summary = "Get all wishlisted products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getWishlist(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.getWishlist(userId)));
    }

    @PostMapping("/{productId}/toggle")
    @Operation(summary = "Toggle a product in/out of the wishlist")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggle(
            @PathVariable UUID productId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.toggle(userId, productId)));
    }

    @GetMapping("/{productId}/status")
    @Operation(summary = "Check if a product is wishlisted")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status(
            @PathVariable UUID productId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        boolean wishlisted = wishlistService.isWishlisted(userId, productId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("wishlisted", wishlisted)));
    }

    @GetMapping("/count")
    @Operation(summary = "Get wishlist item count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> count(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", wishlistService.getCount(userId))));
    }
}
