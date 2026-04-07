package NexVault.service;

import NexVault.dto.request.RazorpayVerifyRequest;
import NexVault.dto.response.RazorpayOrderResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Order;
import NexVault.model.Payment;
import NexVault.model.PaymentProvider;
import NexVault.model.PaymentStatus;
import NexVault.repository.OrderRepository;
import NexVault.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final OrderRepository   orderRepository;
    private final PaymentRepository paymentRepository;
    private final CartService       cartService;

    @Value("${app.razorpay.key-id:rzp_test_placeholder}")
    private String keyId;

    @Value("${app.razorpay.key-secret:placeholder}")
    private String keySecret;

    @Transactional
    public RazorpayOrderResponse createOrder(UUID orderId, BigDecimal amountINR, UUID userId) {
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
            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject options = new JSONObject();
            options.put("amount",   amountInPaise);
            options.put("currency", "INR");
            options.put("receipt",  "hv_" + orderId.toString().substring(0, 8));

            JSONObject notes = new JSONObject();
            notes.put("orderId", orderId.toString());
            notes.put("userId",  userId.toString());
            options.put("notes", notes);

            com.razorpay.Order razorpayOrder = razorpay.orders.create(options);
            String razorpayOrderId = razorpayOrder.get("id");

            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setProvider(PaymentProvider.RAZORPAY);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setRazorpayOrderId(razorpayOrderId);
            payment.setAmount(amountINR);
            paymentRepository.save(payment);

            return new RazorpayOrderResponse(razorpayOrderId, keyId, amountInPaise, "INR", orderId);

        } catch (RazorpayException e) {
            throw new RuntimeException("Razorpay error: " + e.getMessage(), e);
        }
    }

    @Transactional
    public boolean verifyPayment(RazorpayVerifyRequest req, UUID userId) {
        Order order = orderRepository.findById(req.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.orderId()));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to this user");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(req.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", req.razorpayOrderId()));

        // Verify HMAC-SHA256 signature
        try {
            String data      = req.razorpayOrderId() + "|" + req.razorpayPaymentId();
            Mac mac          = Mac.getInstance("HmacSHA256");
            SecretKeySpec sk = new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(sk);
            byte[] hash     = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);

            if (!MessageDigest.isEqual(computed.getBytes(StandardCharsets.UTF_8),
                                        req.razorpaySignature().getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Payment verification failed: invalid signature");
            }
        } catch (java.security.NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new RuntimeException("HMAC verification error", e);
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(req.razorpayPaymentId());
        paymentRepository.save(payment);

        order.setStatus("CONFIRMED");
        order.setPaidAt(LocalDateTime.now());
        order.setPaymentMethod("RAZORPAY");
        orderRepository.save(order);
        cartService.clearCart(userId);

        log.info("Razorpay payment confirmed for order {}", order.getId());
        return true;
    }
}
