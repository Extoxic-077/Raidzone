package Raidzone.dto.response;

import java.util.UUID;

public record CoinbaseChargeResponse(
        String chargeId,
        String chargeCode,
        String hostedUrl,
        String expiresAt,
        UUID hashvaultOrderId
) {}
