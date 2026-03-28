package NexVault.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full cart payload returned to the frontend.
 */
public record CartResponse(
        List<CartItemResponse> items,
        int totalItems,
        BigDecimal subtotal
) {}
