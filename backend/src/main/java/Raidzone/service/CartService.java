package Raidzone.service;

import Raidzone.dto.request.CartItemRequest;
import Raidzone.dto.response.CartItemResponse;
import Raidzone.dto.response.CartResponse;
import Raidzone.exception.ResourceNotFoundException;
import Raidzone.model.Product;
import Raidzone.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;

/**
 * Redis-backed shopping cart service.
 *
 * <p>Cart data is stored as a Redis hash at key {@code cart:{userId}}.
 * Each hash field is a product UUID string; each value is the integer quantity
 * serialised as a JSON number.  The hash expires after 7 days of inactivity.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final Duration CART_TTL = Duration.ofDays(7);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    // ── Public API ────────────────────────────────────────────────────────────

    public CartResponse getCart(UUID userId) {
        String key = cartKey(userId);
        Map<Object, Object> raw = redisTemplate.opsForHash().entries(key);
        return buildCartResponse(raw);
    }

    public CartResponse addItem(UUID userId, CartItemRequest req) {
        Product product = productRepository.findById(req.productId())
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Product", req.productId()));

        String key = cartKey(userId);
        String field = req.productId().toString();

        Object existing = redisTemplate.opsForHash().get(key, field);
        int current = existing != null ? toInt(existing) : 0;
        int newQty = current + req.quantity();

        redisTemplate.opsForHash().put(key, field, newQty);
        redisTemplate.expire(key, CART_TTL);

        log.info("Cart[{}] addItem product={} qty={}", userId, req.productId(), newQty);
        return getCart(userId);
    }

    public CartResponse updateItem(UUID userId, UUID productId, int quantity) {
        if (quantity <= 0) return removeItem(userId, productId);

        String key = cartKey(userId);
        String field = productId.toString();

        if (!Boolean.TRUE.equals(redisTemplate.opsForHash().hasKey(key, field))) {
            throw new ResourceNotFoundException("Cart item", productId);
        }

        redisTemplate.opsForHash().put(key, field, quantity);
        redisTemplate.expire(key, CART_TTL);
        return getCart(userId);
    }

    public CartResponse removeItem(UUID userId, UUID productId) {
        String key = cartKey(userId);
        redisTemplate.opsForHash().delete(key, productId.toString());
        return getCart(userId);
    }

    public void clearCart(UUID userId) {
        redisTemplate.delete(cartKey(userId));
    }

    public int getCartCount(UUID userId) {
        String key = cartKey(userId);
        Map<Object, Object> raw = redisTemplate.opsForHash().entries(key);
        return raw.values().stream().mapToInt(this::toInt).sum();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String cartKey(UUID userId) {
        return CART_KEY_PREFIX + userId;
    }

    private CartResponse buildCartResponse(Map<Object, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            return new CartResponse(List.of(), 0, BigDecimal.ZERO);
        }

        List<UUID> productIds = raw.keySet().stream()
                .map(k -> UUID.fromString(k.toString()))
                .toList();

        List<Product> products = productRepository.findAllById(productIds);
        Map<UUID, Product> productMap = new HashMap<>();
        for (Product p : products) productMap.put(p.getId(), p);

        List<CartItemResponse> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (Map.Entry<Object, Object> entry : raw.entrySet()) {
            UUID productId = UUID.fromString(entry.getKey().toString());
            int qty = toInt(entry.getValue());
            Product product = productMap.get(productId);
            if (product == null) continue;

            boolean available = Boolean.TRUE.equals(product.getIsActive()) && product.getStockCount() > 0;
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
            items.add(new CartItemResponse(
                    product.getId(),
                    product.getName(),
                    product.getImageUrl(),
                    product.getPrice(),
                    product.getOriginalPrice(),
                    qty,
                    lineTotal,
                    available
            ));
            if (available) {
                subtotal = subtotal.add(lineTotal);
                totalItems += qty;
            }
        }

        items.sort(Comparator.comparing(CartItemResponse::name));
        return new CartResponse(items, totalItems, subtotal);
    }

    private int toInt(Object value) {
        if (value instanceof Integer i) return i;
        if (value instanceof Long l) return l.intValue();
        if (value instanceof Number n) return n.intValue();
        try {
            return objectMapper.convertValue(value, Integer.class);
        } catch (Exception e) {
            return 0;
        }
    }
}
