package NexVault.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ChatMessageRequest(
    @NotBlank(message = "Message content cannot be blank")
    String content
) {}
