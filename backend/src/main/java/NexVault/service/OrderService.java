package NexVault.service;

import NexVault.dto.request.CreateOrderRequest;
import NexVault.dto.response.CartResponse;
import NexVault.dto.response.CouponApplyResponse;
import NexVault.dto.response.OrderItemResponse;
import NexVault.dto.response.OrderResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Coupon;
import NexVault.model.DigitalKey;
import NexVault.model.Order;
import NexVault.model.OrderItem;
import NexVault.model.User;
import NexVault.repository.CouponRepository;
import NexVault.repository.DigitalKeyRepository;
import NexVault.repository.OrderRepository;
import NexVault.repository.ProductRepository;
import NexVault.repository.UserRepository;
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
            item.setProductEmoji(ci.imageEmoji());
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
        return OrderResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(UUID userId) {
        return orderRepository.findByUserIdWithItems(userId)
                .stream()
                .map(order -> enrichWithKeyRevealStatus(order))
                .toList();
    }

    private OrderResponse enrichWithKeyRevealStatus(Order order) {
        var enrichedItems = order.getItems().stream().map(item -> {
            OrderItemResponse base = OrderItemResponse.from(item);
            if (item.getDigitalKeyId() == null) return base;
            boolean revealed = digitalKeyRepository.findById(item.getDigitalKeyId())
                    .map(DigitalKey::isRevealed).orElse(false);
            return base.withRevealStatus(revealed);
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
