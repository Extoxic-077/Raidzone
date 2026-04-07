package NexVault.controller;

import NexVault.dto.request.CoinbaseChargeRequest;
import NexVault.dto.request.RazorpayOrderRequest;
import NexVault.dto.request.RazorpayVerifyRequest;
import NexVault.dto.request.StripeIntentRequest;
import NexVault.dto.response.*;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Order;
import NexVault.repository.OrderRepository;
import NexVault.service.CoinbaseService;
import NexVault.service.RazorpayService;
import NexVault.service.StripeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment provider integrations")
public class PaymentController {

    private final StripeService    stripeService;
    private final RazorpayService  razorpayService;
    private final CoinbaseService  coinbaseService;
    private final OrderRepository  orderRepository;

    // ── Stripe ────────────────────────────────────────────────────────────────

    @PostMapping("/stripe/intent")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a Stripe PaymentIntent for an order")
    public ResponseEntity<ApiResponse<StripeIntentResponse>> createStripeIntent(
            @RequestBody StripeIntentRequest req,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        Order order = orderRepository.findById(req.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.orderId()));
        StripeIntentResponse resp = stripeService.createPaymentIntent(req.orderId(), order.getTotalAmount(), userId);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping("/stripe/webhook")
    @Operation(summary = "Stripe webhook (public — no auth)")
    public ResponseEntity<Void> stripeWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature)
            throws IOException {

        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean ok = stripeService.handleWebhook(rawBody, stripeSignature != null ? stripeSignature : "");
        return ok ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    // ── Razorpay ──────────────────────────────────────────────────────────────

    @PostMapping("/razorpay/order")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a Razorpay order for payment")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createRazorpayOrder(
            @RequestBody RazorpayOrderRequest req,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        Order order = orderRepository.findById(req.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.orderId()));
        RazorpayOrderResponse resp = razorpayService.createOrder(req.orderId(), order.getTotalAmount(), userId);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping("/razorpay/verify")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Verify a Razorpay payment signature")
    public ResponseEntity<ApiResponse<Void>> verifyRazorpayPayment(
            @RequestBody RazorpayVerifyRequest req,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        razorpayService.verifyPayment(req, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Payment verified successfully"));
    }

    // ── Coinbase ──────────────────────────────────────────────────────────────

    @PostMapping("/coinbase/charge")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a Coinbase Commerce charge for an order")
    public ResponseEntity<ApiResponse<CoinbaseChargeResponse>> createCoinbaseCharge(
            @RequestBody CoinbaseChargeRequest req,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        Order order = orderRepository.findById(req.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.orderId()));
        CoinbaseChargeResponse resp = coinbaseService.createCharge(req.orderId(), order.getTotalAmount(), userId);
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @PostMapping("/coinbase/webhook")
    @Operation(summary = "Coinbase Commerce webhook (public — no auth)")
    public ResponseEntity<Void> coinbaseWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "X-CC-Webhook-Signature", required = false) String webhookSignature)
            throws IOException {

        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        coinbaseService.handleWebhook(rawBody, webhookSignature != null ? webhookSignature : "");
        return ResponseEntity.ok().build();
    }

    // ── Status polling ────────────────────────────────────────────────────────

    @GetMapping("/order/{orderId}/status")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Poll an order's payment status (used by Coinbase waiting UI)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderStatus(
            @PathVariable UUID orderId,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to this user");
        }

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status",        order.getStatus());
        status.put("paidAt",        order.getPaidAt());
        status.put("paymentMethod", order.getPaymentMethod());
        return ResponseEntity.ok(ApiResponse.ok(status));
    }
}
