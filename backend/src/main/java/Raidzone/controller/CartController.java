package Raidzone.controller;

import Raidzone.dto.request.CartItemRequest;
import Raidzone.dto.response.ApiResponse;
import Raidzone.dto.response.CartResponse;
import Raidzone.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST endpoints for the authenticated user's shopping cart.
 * Cart state lives in Redis, keyed by user UUID.
 */
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart operations (requires authentication)")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCart(userId)));
    }

    @GetMapping("/count")
    @Operation(summary = "Get total item count in cart")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getCartCount(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        int count = cartService.getCartCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to the cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @Valid @RequestBody CartItemRequest req,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(cartService.addItem(userId, req)));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update item quantity (set to 0 to remove)")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @PathVariable UUID productId,
            @RequestBody Map<String, Integer> body,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        int quantity = body.getOrDefault("quantity", 0);
        return ResponseEntity.ok(ApiResponse.ok(cartService.updateItem(userId, productId, quantity)));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove a specific item from the cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @PathVariable UUID productId,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(cartService.removeItem(userId, productId)));
    }

    @DeleteMapping
    @Operation(summary = "Clear the entire cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cart cleared"));
    }
}
