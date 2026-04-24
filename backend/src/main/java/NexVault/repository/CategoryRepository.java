package NexVault.repository;

import NexVault.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByIsActiveTrueOrderBySortOrderAsc();

    Optional<Category> findBySlugAndIsActiveTrue(String slug);

    /** Returns active root (parentless) categories ordered by sort_order. */
    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.parent IS NULL ORDER BY c.sortOrder ASC")
    List<Category> findActiveRoots();

    /** Returns active children of a given parent. */
    List<Category> findByParentIdAndIsActiveTrueOrderBySortOrderAsc(UUID parentId);

    long countByParentId(UUID parentId);
}
