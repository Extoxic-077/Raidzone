package NexVault.dto.response;

import NexVault.model.Category;

import java.util.UUID;

/**
 * Read-only response DTO for a {@link Category} entity.
 *
 * <p>Only the fields needed by the frontend are included; internal database
 * details (e.g. {@code isActive}) are intentionally omitted from the public API.</p>
 *
 * @param id          the category's UUID primary key
 * @param name        human-readable display name (e.g. "Gift Cards")
 * @param slug        URL-safe identifier used in API routes (e.g. "gift-cards")
 * @param description optional longer description; may be {@code null}
 * @param emoji       unicode emoji displayed next to the category name; may be {@code null}
 * @param sortOrder   display order on the storefront (ascending)
 */
public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String emoji,
        Integer sortOrder,
        Boolean isActive
) {

    /**
     * Maps a {@link Category} entity to a {@code CategoryResponse} DTO.
     *
     * @param category the entity to map; must not be {@code null}
     * @return a new {@code CategoryResponse} populated from the given entity
     */
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getEmoji(),
                category.getSortOrder(),
                category.getIsActive()
        );
    }
}
