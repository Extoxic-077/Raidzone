package Raidzone.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record StripeIntentResponse(
        String clientSecret,
        String publishableKey,
        BigDecimal amount,
        UUID orderId
) {}
