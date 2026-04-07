package NexVault.service;

import NexVault.dto.response.StripeIntentResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Order;
import NexVault.model.Payment;
import NexVault.model.PaymentProvider;
import NexVault.model.PaymentStatus;
import NexVault.repository.OrderRepository;
import NexVault.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeService {

    private final OrderRepository   orderRepository;
    private final PaymentRepository paymentRepository;
    private final CartService       cartService;

    @Value("${app.stripe.secret-key:sk_test_placeholder}")
    private String secretKey;

    @Value("${app.stripe.publishable-key:pk_test_placeholder}")
    private String publishableKey;

    @Value("${app.stripe.webhook-secret:whsec_placeholder}")
    private String webhookSecret;

    @Transactional
    public StripeIntentResponse createPaymentIntent(UUID orderId, BigDecimal amountINR, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to this user");
        }
        if (!"PENDING_PAYMENT".equals(order.getStatus())) {
            throw new IllegalStateException("Order is not awaiting payment (status: " + order.getStatus() + ")");
        }

        long amountInPaise = amountINR.multiply(BigDecimal.valueOf(100)).longValue();

        try {
            Stripe.apiKey = secretKey;
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInPaise)
                    .setCurrency("inr")
                    .putMetadata("orderId", orderId.toString())
                    .putMetadata("userId", userId.toString())
                    .setDescription("HashVault Order " + orderId)
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setProvider(PaymentProvider.STRIPE);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setStripePaymentIntentId(intent.getId());
            payment.setAmount(amountINR);
            paymentRepository.save(payment);

            return new StripeIntentResponse(intent.getClientSecret(), publishableKey, amountINR, orderId);

        } catch (StripeException e) {
            throw new RuntimeException("Stripe error: " + e.getMessage(), e);
        }
    }

    @Transactional
    public boolean handleWebhook(String rawBody, String stripeSignature) {
        Event event;
        try {
            event = Webhook.constructEvent(rawBody, stripeSignature, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
            return false;
        }

        String eventType = event.getType();
        String intentId  = event.getDataObjectDeserializer()
                .getObject()
                .map(obj -> ((PaymentIntent) obj).getId())
                .orElse(null);

        if (intentId == null) return true;

        if ("payment_intent.succeeded".equals(eventType)) {
            paymentRepository.findByStripePaymentIntentId(intentId).ifPresentOrElse(payment -> {
                payment.setStatus(PaymentStatus.SUCCESS);
                paymentRepository.save(payment);
                Order order = payment.getOrder();
                order.setStatus("CONFIRMED");
                order.setPaidAt(LocalDateTime.now());
                order.setPaymentMethod("STRIPE");
                orderRepository.save(order);
                cartService.clearCart(order.getUser().getId());
                log.info("Stripe payment confirmed for order {}", order.getId());
            }, () -> log.warn("Stripe webhook: payment not found for intent {}", intentId));

        } else if ("payment_intent.payment_failed".equals(eventType)) {
            paymentRepository.findByStripePaymentIntentId(intentId).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                log.warn("Stripe payment failed for intent {}", intentId);
            });
        }

        return true;
    }
}
