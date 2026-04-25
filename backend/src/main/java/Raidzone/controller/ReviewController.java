package Raidzone.controller;

import Raidzone.dto.request.CreateReviewRequest;
import Raidzone.dto.response.ApiResponse;
import Raidzone.dto.response.ReviewResponse;
import Raidzone.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints for product reviews.
 *
 * <ul>
 *   <li>GET  /api/v1/products/{productId}/reviews — public, lists all reviews for a product</li>
 *   <li>POST /api/v1/products/{productId}/reviews — authenticated, creates or updates the
 *       caller's review (one review per user per product)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Product reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "List reviews for a product (public)")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> listReviews(
            @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getReviews(productId)));
    }

    @PostMapping
    @Operation(summary = "Create or update your review for a product (authenticated)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ReviewResponse>> upsertReview(
            @PathVariable UUID productId,
            @Valid @RequestBody CreateReviewRequest req,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        ReviewResponse saved = reviewService.createOrUpdate(productId, userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(saved, "Review saved"));
    }
}
