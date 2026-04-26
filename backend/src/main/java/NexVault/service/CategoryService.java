package NexVault.service;

import NexVault.dto.response.CategoryResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer for category-related business logic.
 *
 * <p>Fetches category data from the {@link CategoryRepository}, maps
 * results to {@link CategoryResponse} DTOs, and enforces the rule that
 * only active categories are visible through the public API.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Returns all active categories ordered by their {@code sortOrder}.
     *
     * <p>Inactive categories (e.g. temporarily hidden ones) are excluded
     * from the result.</p>
     *
     * @return an ordered list of {@link CategoryResponse} DTOs; never {@code null},
     *         but may be empty if no active categories exist
     */
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findActiveRoots().stream()
                .map(this::buildNestedResponse)
                .toList();
    }

    private CategoryResponse buildNestedResponse(NexVault.model.Category category) {
        List<CategoryResponse> children = categoryRepository
                .findByParentIdAndIsActiveTrueOrderBySortOrderAsc(category.getId())
                .stream()
                .map(this::buildNestedResponse)
                .toList();
        return CategoryResponse.fromWithChildren(category, children);
    }

    public List<CategoryResponse> getAllCategoriesFlat() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    /**
     * Returns a single active category identified by its URL slug.
     *
     * @param slug the URL-safe category slug (e.g. {@code "gift-cards"})
     * @return the matching {@link CategoryResponse}
     * @throws ResourceNotFoundException if no active category with the given slug exists
     */
    public CategoryResponse getCategoryBySlug(String slug) {
        log.info("Looking up category by slug: {}", slug);

        return categoryRepository.findBySlugAndIsActiveTrue(slug)
                .map(CategoryResponse::from)
                .orElseThrow(() -> {
                    log.warn("Category not found for slug: {}", slug);
                    return new ResourceNotFoundException("Category", slug);
                });
    }
}
