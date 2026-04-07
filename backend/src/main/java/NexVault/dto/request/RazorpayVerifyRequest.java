package NexVault.dto.request;

import java.util.UUID;

public record RazorpayVerifyRequest(
        UUID orderId,
        String razorpayOrderId,
        String razorpayPaymentId,
        String razorpaySignature
) {}
