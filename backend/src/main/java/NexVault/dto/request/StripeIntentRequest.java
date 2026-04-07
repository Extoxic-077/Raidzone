package NexVault.dto.request;

import java.util.UUID;

public record StripeIntentRequest(UUID orderId) {}
