package Raidzone.service;

import Raidzone.dto.request.CreateReviewRequest;
import Raidzone.dto.response.ReviewResponse;
import Raidzone.exception.PurchaseRequiredException;
import Raidzone.exception.ResourceNotFoundException;
import Raidzone.model.Product;
import Raidzone.model.Review;
import Raidzone.model.User;
import Raidzone.repository.OrderRepository;
import Raidzone.repository.ProductRepository;
import Raidzone.repository.ReviewRepository;
import Raidzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Business logic for product reviews.
 *
 * <p>Each user may leave at most one review per product (upsert semantics).
 * After every write the product's {@code avgRating} and {@code reviewCount}
 * are recalculated and persisted atomically in the same transaction.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository  reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository    userRepository;
    private final OrderRepository   orderRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(UUID productId) {
        return reviewRepository.findByProductId(productId)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    /**
     * Creates or updates the authenticated user's review for a product.
     * Recalculates the product's aggregate rating after the write.
     *
     * @param productId  target product
     * @param userId     authenticated reviewer
     * @param req        rating + optional comment
     * @return the saved {@link ReviewResponse}
     */
    @Transactional
    public ReviewResponse createOrUpdate(UUID productId, UUID userId, CreateReviewRequest req) {
        // Only verified buyers may review
        if (!orderRepository.existsConfirmedOrderWithProduct(userId, productId)) {
            throw new PurchaseRequiredException();
        }

        Product product = productRepository.findById(productId)
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Review review = reviewRepository.findByProduct_IdAndUser_Id(productId, userId)
                .orElseGet(() -> {
                    Review r = new Review();
                    r.setProduct(product);
                    r.setUser(user);
                    return r;
                });

        review.setRating(req.rating());
        review.setComment(req.comment() != null ? req.comment().strip() : null);
        review = reviewRepository.save(review);

        // Recalculate and persist aggregate stats on the product
        long count = reviewRepository.countByProduct_Id(productId);
        double avg  = reviewRepository.avgRatingByProductId(productId);
        product.setReviewCount((int) count);
        product.setAvgRating(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
        productRepository.save(product);

        log.info("Review upsert — product={} user={} rating={}", productId, userId, req.rating());
        return ReviewResponse.from(review);
    }
}
