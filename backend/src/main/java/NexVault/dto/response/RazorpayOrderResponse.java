package NexVault.dto.response;

import java.util.UUID;

public record RazorpayOrderResponse(
        String razorpayOrderId,
        String keyId,
        Long amountInPaise,
        String currency,
        UUID hashvaultOrderId
) {}
