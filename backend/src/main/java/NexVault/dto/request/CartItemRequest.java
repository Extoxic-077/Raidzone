package NexVault.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body for adding or updating a cart item.
 */
public record CartItemRequest(
        @NotNull UUID productId,
        @Min(1) int quantity
) {}
