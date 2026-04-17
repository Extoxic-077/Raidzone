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

    public CoinbaseChargeResponse createCharge(UUID orderId, BigDecimal amountINR, UUID userId) {
        throw new IllegalStateException(
                "Crypto payments are temporarily unavailable. Coinbase Commerce has shut down. " +
                "Please use Card or UPI payment instead.");
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
