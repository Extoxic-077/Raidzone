package NexVault.service;

import NexVault.dto.response.CoinbaseChargeResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Order;
import NexVault.model.Payment;
import NexVault.model.PaymentProvider;
import NexVault.model.PaymentStatus;
import NexVault.repository.OrderRepository;
import NexVault.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoinbaseService {

    private final OrderRepository   orderRepository;
    private final PaymentRepository paymentRepository;
    private final RestTemplate      restTemplate;
    private final ObjectMapper      objectMapper;
    private final CartService       cartService;

    @Value("${app.coinbase.api-key:placeholder}")
    private String apiKey;

    @Value("${app.coinbase.webhook-secret:placeholder}")
    private String webhookSecret;

    private static final String COINBASE_API = "https://api.commerce.coinbase.com/charges";

    @Transactional
    public CoinbaseChargeResponse createCharge(UUID orderId, BigDecimal amountINR, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to this user");
        }
        if (!"PENDING_PAYMENT".equals(order.getStatus())) {
            throw new IllegalStateException("Order is not awaiting payment (status: " + order.getStatus() + ")");
        }

        Map<String, Object> localPrice = new LinkedHashMap<>();
        localPrice.put("amount",   amountINR.toPlainString());
        localPrice.put("currency", "INR");

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("orderId", orderId.toString());
        metadata.put("userId",  userId.toString());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name",         "HashVault Digital Goods");
        body.put("description",  "Order " + orderId);
        body.put("pricing_type", "fixed_price");
        body.put("local_price",  localPrice);
        body.put("metadata",     metadata);
        body.put("redirect_url", "http://localhost:3000/orders.html");
        body.put("cancel_url",   "http://localhost:3000/cart.html");

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-CC-Api-Key", apiKey);
        headers.set("X-CC-Version", "2018-03-22");
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                COINBASE_API,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                new ParameterizedTypeReference<>() {}
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");

        String chargeId   = (String) data.get("id");
        String chargeCode = (String) data.get("code");
        String hostedUrl  = (String) data.get("hosted_url");
        String expiresAt  = (String) data.get("expires_at");

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(PaymentProvider.COINBASE);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCoinbaseChargeId(chargeId);
        payment.setCoinbaseChargeCode(chargeCode);
        payment.setCoinbaseHostedUrl(hostedUrl);
        payment.setAmount(amountINR);
        paymentRepository.save(payment);

        return new CoinbaseChargeResponse(chargeId, chargeCode, hostedUrl, expiresAt, orderId);
    }

    @Transactional
    public boolean handleWebhook(String rawBody, String webhookSignature) {
        // 1. Verify HMAC-SHA256
        try {
            Mac mac          = Mac.getInstance("HmacSHA256");
            SecretKeySpec sk = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(sk);
            byte[] hash     = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);

            if (!MessageDigest.isEqual(computed.getBytes(StandardCharsets.UTF_8),
                                        webhookSignature.getBytes(StandardCharsets.UTF_8))) {
                log.warn("Coinbase webhook signature mismatch");
                return false;
            }
        } catch (Exception e) {
            log.warn("Coinbase webhook verification error: {}", e.getMessage());
            return false;
        }

        // 2. Parse event
        try {
            JsonNode root      = objectMapper.readTree(rawBody);
            String   eventType = root.path("event").path("type").asText();
            String   chargeId  = root.path("event").path("data").path("id").asText();

            if (chargeId.isBlank()) return true;

            if ("charge:confirmed".equals(eventType) || "charge:resolved".equals(eventType)) {
                paymentRepository.findByCoinbaseChargeId(chargeId).ifPresentOrElse(payment -> {
                    payment.setStatus(PaymentStatus.SUCCESS);
                    paymentRepository.save(payment);
                    Order order = payment.getOrder();
                    order.setStatus("CONFIRMED");
                    order.setPaidAt(LocalDateTime.now());
                    order.setPaymentMethod("COINBASE");
                    orderRepository.save(order);
                    cartService.clearCart(order.getUser().getId());
                    log.info("Coinbase payment confirmed for order {}", order.getId());
                }, () -> log.warn("Coinbase webhook: payment not found for charge {}", chargeId));

            } else if ("charge:failed".equals(eventType) || "charge:expired".equals(eventType)) {
                paymentRepository.findByCoinbaseChargeId(chargeId).ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    log.warn("Coinbase charge {} {}", eventType, chargeId);
                });
            }
        } catch (Exception e) {
            log.error("Coinbase webhook parse error: {}", e.getMessage());
        }

        return true;
    }
}
