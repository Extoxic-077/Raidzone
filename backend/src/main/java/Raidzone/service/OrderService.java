package Raidzone.service;

import Raidzone.dto.request.CreateOrderRequest;
import Raidzone.dto.response.CartResponse;
import Raidzone.dto.response.CouponApplyResponse;
import Raidzone.dto.response.OrderItemResponse;
import Raidzone.dto.response.OrderResponse;
import Raidzone.exception.ResourceNotFoundException;
import Raidzone.model.Coupon;
import Raidzone.model.DigitalKey;
import Raidzone.model.Order;
import Raidzone.model.OrderItem;
import Raidzone.model.User;
import Raidzone.repository.CouponRepository;
import Raidzone.repository.DigitalKeyRepository;
import Raidzone.repository.OrderRepository;
import Raidzone.repository.ProductRepository;
import Raidzone.repository.ReviewRepository;
import Raidzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository      orderRepository;
    private final UserRepository       userRepository;
    private final ProductRepository    productRepository;
    private final CartService          cartService;
    private final CouponService        couponService;
    private final CouponRepository     couponRepository;
    private final DigitalKeyRepository digitalKeyRepository;
    private final ReviewRepository     reviewRepository;
    private final NotificationService  notificationService;

    @Transactional
    public OrderResponse createOrder(UUID userId, CreateOrderRequest req) {
        CartResponse cart = cartService.getCart(userId);
        if (cart.items().isEmpty()) {
            throw new IllegalStateException("Cannot place an order with an empty cart");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING_PAYMENT");
        order.setTotalAmount(cart.subtotal());
        order.setTotalItems(cart.totalItems());
        order.setShippingName(req.name());
        order.setShippingEmail(req.email());
        order.setShippingPhone(req.phone());
        order.setShippingAddress(req.address());

        cart.items().forEach(ci -> {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductName(ci.name());
            item.setImageUrl(ci.imageUrl());
            item.setPrice(ci.price());
            item.setQuantity(ci.quantity());
            item.setLineTotal(ci.lineTotal());
            productRepository.findById(ci.productId()).ifPresent(item::setProduct);
            order.getItems().add(item);
        });

        // ── Coupon handling ───────────────────────────────────────────────────
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode  = null;

        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            CouponApplyResponse couponResp = couponService.validateAndPreview(
                    req.couponCode(), cart.subtotal(), userId);
            discountAmount    = couponResp.discountAmount();
            appliedCouponCode = couponResp.code().toUpperCase();
            order.setDiscountAmount(discountAmount);
            order.setCouponCode(appliedCouponCode);
            order.setTotalAmount(cart.subtotal().subtract(discountAmount));
        }

        Order saved = orderRepository.save(order);
        // Cart is cleared only after payment is confirmed (see StripeService / RazorpayService / CoinbaseService)

        // Redeem coupon only after order is persisted
        if (appliedCouponCode != null) {
            final String finalCouponCode = appliedCouponCode;
            Coupon coupon = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(finalCouponCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Coupon not found", finalCouponCode));
            couponService.redeemCoupon(coupon, user, saved, discountAmount);
        }

        log.info("Order created: id={} user={} total={} status=PENDING_PAYMENT",
                saved.getId(), userId, saved.getTotalAmount());
        
        notificationService.broadcastNewOrder(saved);
        
        return OrderResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(UUID userId) {
        return orderRepository.findByUserIdWithItems(userId)
                .stream()
                .map(order -> enrichWithKeyRevealStatus(order))
                .toList();
    }

    /**
     * Returns the last 10 confirmed orders with masked buyer info.
     * Used for the social proof notification system.
     */
    @Transactional(readOnly = true)
    public List<PublicOrderActivity> getRecentPublicOrders() {
        // We only want CONFIRMED or DELIVERED orders that actually have items
        return orderRepository.findTop10ByStatusInOrderByCreatedAtDesc(List.of("CONFIRMED", "DELIVERED"))
                .stream()
                .map(o -> {
                    String name = o.getShippingName() != null ? o.getShippingName() : "A customer";
                    // Mask name: "John Doe" -> "John D."
                    String masked = name;
                    if (name.contains(" ")) {
                        String[] parts = name.split(" ");
                        masked = parts[0] + " " + parts[1].charAt(0) + ".";
                    }
                    
                    String firstProd = "a product";
                    if (!o.getItems().isEmpty()) {
                        firstProd = o.getItems().get(0).getProductName();
                    }
                    
                    return new PublicOrderActivity(masked, firstProd, o.getCreatedAt());
                })
                .toList();
    }

    public record PublicOrderActivity(String customerName, String productName, java.time.LocalDateTime createdAt) {}

    private OrderResponse enrichWithKeyRevealStatus(Order order) {
        UUID userId = order.getUser().getId();
        var enrichedItems = order.getItems().stream().map(item -> {
            OrderItemResponse base = OrderItemResponse.from(item);
            // Key reveal status
            if (item.getDigitalKeyId() != null) {
                boolean revealed = digitalKeyRepository.findById(item.getDigitalKeyId())
                        .map(DigitalKey::isRevealed).orElse(false);
                base = base.withRevealStatus(revealed);
            }
            // Review status — only relevant for CONFIRMED orders with a product
            if (item.getProduct() != null) {
                boolean reviewed = reviewRepository.existsByProduct_IdAndUser_Id(
                        item.getProduct().getId(), userId);
                base = base.withReviewStatus(reviewed);
            }
            return base;
        }).toList();

        return new OrderResponse(
                order.getId(), order.getStatus(), order.getTotalAmount(),
                order.getDiscountAmount(), order.getCouponCode(), order.getPaymentMethod(),
                order.getPaidAt(), order.getTotalItems(), order.getShippingName(),
                order.getShippingEmail(), order.getShippingPhone(), order.getShippingAddress(),
                enrichedItems, order.getCreatedAt()
        );
    }
}
