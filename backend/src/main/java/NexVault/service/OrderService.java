package NexVault.service;

import NexVault.dto.request.CreateOrderRequest;
import NexVault.dto.response.CartResponse;
import NexVault.dto.response.OrderResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Order;
import NexVault.model.OrderItem;
import NexVault.model.User;
import NexVault.repository.OrderRepository;
import NexVault.repository.ProductRepository;
import NexVault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Handles order creation from the current Redis cart and order history retrieval.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository    orderRepository;
    private final UserRepository     userRepository;
    private final ProductRepository  productRepository;
    private final CartService        cartService;

    /**
     * Creates an order from the caller's current Redis cart, then clears the cart.
     *
     * @throws IllegalStateException if the cart is empty
     */
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
        order.setStatus("CONFIRMED");
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
            // Soft-link to product (nullable FK — won't break if product is deleted later)
            productRepository.findById(ci.productId()).ifPresent(item::setProduct);
            order.getItems().add(item);
        });

        Order saved = orderRepository.save(order);
        cartService.clearCart(userId);

        log.info("Order created: id={} user={} total={}", saved.getId(), userId, saved.getTotalAmount());
        return OrderResponse.from(saved);
    }

    /** Returns all orders for the authenticated user, newest first. */
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(UUID userId) {
        return orderRepository.findByUserIdWithItems(userId)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }
}
