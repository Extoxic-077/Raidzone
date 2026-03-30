package NexVault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String slug,
        String description,
        @Size(max = 10) String emoji,
        Integer sortOrder,
        Boolean isActive
) {}
