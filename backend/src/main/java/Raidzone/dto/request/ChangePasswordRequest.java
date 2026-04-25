package Raidzone.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @Size(min = 8, max = 128) String newPassword,
        @NotBlank @Size(min = 6, max = 6)   String otpCode
) {}
