package NexVault.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String slug,
        String description,
        Integer sortOrder,
        Boolean isActive,
        java.util.UUID parentId
) {}
