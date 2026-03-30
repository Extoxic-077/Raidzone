package NexVault.controller;

import NexVault.dto.request.CreateOrderRequest;
import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.OrderResponse;
import NexVault.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for orders.
 *
 * <ul>
 *   <li>POST /api/v1/orders     — create an order from the current cart</li>
 *   <li>GET  /api/v1/orders/my  — list the caller's orders (newest first)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and history (requires authentication)")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place an order from the current cart")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        OrderResponse order = orderService.createOrder(userId, req);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order placed successfully"));
    }

    @GetMapping("/my")
    @Operation(summary = "Get the authenticated user's order history")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(orderService.getMyOrders(userId)));
    }
}
