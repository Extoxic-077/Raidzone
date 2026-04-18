package NexVault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CampaignRequest(
    @NotBlank @Size(max = 200) String subject,
    @NotBlank String htmlBody,
    boolean includeRegistered
) {}
