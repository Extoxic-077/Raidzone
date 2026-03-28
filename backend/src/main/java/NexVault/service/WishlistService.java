package NexVault.service;

import NexVault.dto.response.ProductResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Product;
import NexVault.model.User;
import NexVault.model.Wishlist;
import NexVault.repository.ProductRepository;
import NexVault.repository.UserRepository;
import NexVault.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Business logic for the user's saved-products wishlist.
 *
 * <p>Wishlist entries are persisted in PostgreSQL (the {@code wishlists} table).
 * Toggle semantics: adding a product that is already in the wishlist removes it.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getWishlist(UUID userId) {
        return wishlistRepository.findByUserIdWithProduct(userId)
                .stream()
                .map(w -> ProductResponse.from(w.getProduct()))
                .toList();
    }

    /**
     * Toggles a product in the user's wishlist.
     * Returns {@code {"added": true/false}} indicating what happened.
     */
    @Transactional
    public Map<String, Object> toggle(UUID userId, UUID productId) {
        if (wishlistRepository.existsByUser_IdAndProduct_Id(userId, productId)) {
            wishlistRepository.deleteByUser_IdAndProduct_Id(userId, productId);
            log.info("Wishlist[{}] removed product {}", userId, productId);
            return Map.of("added", false, "count", wishlistRepository.countByUser_Id(userId));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Product product = productRepository.findById(productId)
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Wishlist entry = new Wishlist();
        entry.setUser(user);
        entry.setProduct(product);
        wishlistRepository.save(entry);

        log.info("Wishlist[{}] added product {}", userId, productId);
        return Map.of("added", true, "count", wishlistRepository.countByUser_Id(userId));
    }

    @Transactional(readOnly = true)
    public boolean isWishlisted(UUID userId, UUID productId) {
        return wishlistRepository.existsByUser_IdAndProduct_Id(userId, productId);
    }

    @Transactional(readOnly = true)
    public long getCount(UUID userId) {
        return wishlistRepository.countByUser_Id(userId);
    }
}
