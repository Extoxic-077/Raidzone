package NexVault.service;

import NexVault.dto.request.CreateProductRequest;
import NexVault.dto.request.UpdateProductRequest;
import NexVault.dto.response.ProductResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Category;
import NexVault.model.Product;
import NexVault.repository.CategoryRepository;
import NexVault.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Admin-only product management: create, update, soft-delete, and list all products
 * (including inactive ones, which are hidden from the public catalogue).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> listAll(int page, int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.ASC, "sortOrder")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        return productRepository.findAll(pageable).map(ProductResponse::from);
    }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        if (req.categoryId() == null) {
            throw new IllegalArgumentException("Category is required");
        }
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));

        Product p = new Product();
        p.setName(req.name());
        p.setSlug(generateSlug(req.name()));
        p.setCategory(category);
        p.setPrice(req.price());
        p.setOriginalPrice(req.originalPrice());
        p.setDescription(req.description());
        p.setHowToRedeem(req.howToRedeem());
        p.setBrand(req.brand());
        p.setProductType(req.productType());
        p.setRegion(req.region() != null ? req.region() : "Global");
        p.setEmoji(req.emoji());
        p.setBadge(req.badge());
        p.setIsFlashDeal(req.isFlashDeal());
        p.setSortOrder(req.sortOrder());
        p.setIsActive(true);

        p = productRepository.save(p);
        log.info("Admin created product {} ({})", p.getName(), p.getId());
        return ProductResponse.from(p);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest req) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (req.name() != null)        { p.setName(req.name()); p.setSlug(generateSlug(req.name())); }
        if (req.categoryId() != null) {
            Category cat = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));
            p.setCategory(cat);
        }
        if (req.price() != null)        p.setPrice(req.price());
        if (req.originalPrice() != null) p.setOriginalPrice(req.originalPrice());
        if (req.description() != null)  p.setDescription(req.description());
        if (req.howToRedeem() != null)  p.setHowToRedeem(req.howToRedeem());
        if (req.brand() != null)        p.setBrand(req.brand());
        if (req.productType() != null)  p.setProductType(req.productType());
        if (req.region() != null)       p.setRegion(req.region());
        if (req.emoji() != null)        p.setEmoji(req.emoji());
        if (req.badge() != null)        p.setBadge(req.badge());
        if (req.isFlashDeal() != null)  p.setIsFlashDeal(req.isFlashDeal());
        if (req.isActive() != null)     p.setIsActive(req.isActive());
        if (req.sortOrder() != null)    p.setSortOrder(req.sortOrder());

        p = productRepository.save(p);
        log.info("Admin updated product {}", id);
        return ProductResponse.from(p);
    }

    @Transactional
    public void softDelete(UUID id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        p.setIsActive(false);
        productRepository.save(p);
        log.info("Admin soft-deleted product {}", id);
    }

    // ── Slug generation ───────────────────────────────────────────────────────

    private String generateSlug(String name) {
        String base = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        String slug = base;
        int suffix = 1;
        while (productRepository.findBySlugAndIsActiveTrue(slug).isPresent()) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}
