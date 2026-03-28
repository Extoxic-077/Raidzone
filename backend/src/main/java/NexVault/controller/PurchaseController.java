package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Product;
import NexVault.model.Purchase;
import NexVault.model.User;
import NexVault.repository.ProductRepository;
import NexVault.repository.PurchaseRepository;
import NexVault.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Endpoints for recording and checking product purchases.
 *
 * <ul>
 *   <li>POST /api/v1/purchases                        — record a purchase (authenticated)</li>
 *   <li>GET  /api/v1/purchases/product/{productId}    — check if caller purchased a product</li>
 * </ul>
 *
 * Both endpoints require authentication and fall under the catch-all
 * {@code .anyRequest().authenticated()} rule in {@link NexVault.config.SecurityConfig}.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchases", description = "Purchase tracking (required to leave a review)")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseController {

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository  productRepository;
    private final UserRepository     userRepository;

    /**
     * Records that the authenticated user purchased {@code productId}.
     * Idempotent: if the purchase already exists the call succeeds silently.
     */
    @PostMapping
    @Transactional
    @Operation(summary = "Record a product purchase (Buy Now)")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> recordPurchase(
            @RequestBody Map<String, String> body,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        UUID productId;
        try {
            productId = UUID.fromString(body.get("productId"));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid productId");
        }

        if (!purchaseRepository.existsByUser_IdAndProduct_Id(userId, productId)) {
            User    user    = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", userId));
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

            Purchase p = new Purchase();
            p.setUser(user);
            p.setProduct(product);
            purchaseRepository.save(p);
            log.info("Purchase recorded: user={} product={}", userId, productId);
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("recorded", true)));
    }

    /**
     * Returns whether the authenticated user has purchased the given product.
     */
    @GetMapping("/product/{productId}")
    @Operation(summary = "Check if the current user purchased a product")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> hasPurchased(
            @PathVariable UUID productId,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        boolean purchased = purchaseRepository.existsByUser_IdAndProduct_Id(userId, productId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("purchased", purchased)));
    }
}
