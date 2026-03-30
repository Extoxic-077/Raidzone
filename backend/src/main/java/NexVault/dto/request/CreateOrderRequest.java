package NexVault.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload submitted by the checkout wizard to create a new order.
 * Cart items are read from Redis server-side; the frontend sends only
 * shipping/contact information.
 */
public record CreateOrderRequest(

        @NotBlank
        @Size(max = 120)
        String name,

        @NotBlank
        @Email
        @Size(max = 200)
        String email,

        @Size(max = 30)
        String phone,

        @Size(max = 500)
        String address
) {}
