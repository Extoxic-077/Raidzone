package NexVault.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PartnershipRequest(
    @NotBlank @Size(max = 150) String name,
    @NotBlank @Email           String email,
    @NotBlank @Size(max = 80)  String type,
    @Size(max = 3000)          String message
) {}
