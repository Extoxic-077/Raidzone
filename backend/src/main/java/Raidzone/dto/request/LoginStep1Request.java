package Raidzone.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginStep1Request(
        @NotBlank @Email String email,
        @NotBlank String password
) {}
