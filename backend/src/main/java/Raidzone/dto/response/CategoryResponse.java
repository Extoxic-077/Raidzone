package Raidzone.dto.response;

import Raidzone.model.Category;

import java.util.List;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String description,
        Integer sortOrder,
        Boolean isActive,
        UUID parentId,
        List<CategoryResponse> children
) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getSortOrder(),
                category.getIsActive(),
                category.getParent() != null ? category.getParent().getId() : null,
                List.of()
        );
    }

    public static CategoryResponse fromWithChildren(Category category, List<CategoryResponse> children) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getSortOrder(),
                category.getIsActive(),
                category.getParent() != null ? category.getParent().getId() : null,
                children
        );
    }
}
