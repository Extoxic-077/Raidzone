package NexVault.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email          String email,
    @NotBlank @Size(max = 80)  String topic,
    @NotBlank @Size(max = 3000) String message
) {}
