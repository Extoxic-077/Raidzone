package Raidzone.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyEmailChangeRequest(
        @NotBlank @Email @Size(max = 255) String newEmail,
        @NotBlank @Size(min = 6, max = 6)  String otpCode
) {}
