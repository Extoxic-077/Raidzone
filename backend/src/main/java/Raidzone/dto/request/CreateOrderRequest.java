package Raidzone.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
        String address,

        // Optional coupon code — null means no coupon
        @Size(max = 50)
        String couponCode
) {}
