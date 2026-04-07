package NexVault.dto.response;

import NexVault.model.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminPaymentResponse(
    UUID id,
    String transactionId,
    UUID orderId,
    String customerName,
    String customerEmail,
    String provider,
    String status,
    BigDecimal amount,
    String currency,
    LocalDateTime createdAt
) {
    public static AdminPaymentResponse from(Payment p) {
        // Consolidate transaction ID from whichever provider was used
        String txId = p.getStripePaymentIntentId() != null ? p.getStripePaymentIntentId()
                    : p.getRazorpayOrderId()        != null ? p.getRazorpayOrderId()
                    : p.getCoinbaseChargeCode()     != null ? p.getCoinbaseChargeCode()
                    : null;
        String custName  = p.getOrder() != null ? p.getOrder().getShippingName()  : null;
        String custEmail = p.getOrder() != null ? p.getOrder().getShippingEmail() : null;
        return new AdminPaymentResponse(
            p.getId(), txId,
            p.getOrder() != null ? p.getOrder().getId() : null,
            custName, custEmail,
            p.getProvider() != null ? p.getProvider().name() : null,
            p.getStatus()   != null ? p.getStatus().name()   : null,
            p.getAmount(), "INR",
            p.getCreatedAt()
        );
    }
}
