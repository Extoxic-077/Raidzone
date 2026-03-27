package NexVault.repository;

import NexVault.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link Category} entities.
 *
 * <p>Extends {@link JpaRepository} to inherit standard CRUD operations and
 * adds two custom query methods for the use-cases needed by Phase 1.</p>
 */
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    /**
     * Returns all active categories ordered by {@code sortOrder} ascending.
     *
     * <p>Only categories with {@code isActive = true} are included so that
     * temporarily hidden categories are not surfaced in the API.</p>
     *
     * @return an ordered list of active categories; empty if none exist
     */
    List<Category> findByIsActiveTrueOrderBySortOrderAsc();

    /**
     * Looks up a single active category by its URL-safe slug.
     *
     * @param slug the slug to search for (e.g. {@code "gift-cards"})
     * @return an {@link Optional} containing the matching category, or
     *         {@link Optional#empty()} if no active category with that slug exists
     */
    Optional<Category> findBySlugAndIsActiveTrue(String slug);
}
