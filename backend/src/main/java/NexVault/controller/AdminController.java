package NexVault.controller;

import NexVault.dto.request.CreateProductRequest;
import NexVault.dto.request.UpdateProductRequest;
import NexVault.dto.response.*;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Product;
import NexVault.model.User;
import NexVault.repository.CategoryRepository;
import NexVault.repository.ProductRepository;
import NexVault.repository.UserRepository;
import NexVault.service.AdminProductService;
import NexVault.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * Administration endpoints for HashVault, restricted to users with the ADMIN role.
 *
 * <p>Security is enforced at the {@link NexVault.config.SecurityConfig} level
 * ({@code .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")}), so no
 * additional annotations are needed on each method.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only operations (requires ADMIN role)")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private final AdminProductService adminProductService;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics (ADMIN)")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        long totalUsers     = userRepository.count();
        long totalProducts  = productRepository.count();
        long activeProducts = productRepository.countByIsActiveTrue();
        long totalCategories = categoryRepository.count();
        return ResponseEntity.ok(ApiResponse.ok(
                new DashboardStatsResponse(totalUsers, totalProducts, activeProducts, totalCategories)));
    }

    // ── Product management ────────────────────────────────────────────────────

    @GetMapping("/products")
    @Operation(summary = "List all products including inactive (ADMIN)")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminProductService.listAll(page, size)));
    }

    @PostMapping("/products")
    @Operation(summary = "Create a new product (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody CreateProductRequest req) {
        ProductResponse created = adminProductService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Product created"));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update an existing product (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminProductService.update(id, req)));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Soft-delete a product (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        adminProductService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product deactivated"));
    }

    // ── Image upload / delete ─────────────────────────────────────────────────

    @PostMapping("/products/{id}/image")
    @Transactional
    @Operation(summary = "Upload a product image (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> uploadProductImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (product.getImageUrl() != null) {
            fileStorageService.deleteImage(product.getImageUrl());
        }
        String imageUrl = fileStorageService.storeProductImage(file, product.getSlug());
        product.setImageUrl(imageUrl);
        productRepository.save(product);

        log.info("Updated image for product {} → {}", id, imageUrl);
        return ResponseEntity.ok(ApiResponse.ok(ProductResponse.from(product), "Image uploaded successfully"));
    }

    @DeleteMapping("/products/{id}/image")
    @Transactional
    @Operation(summary = "Delete a product image (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> deleteProductImage(@PathVariable UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (product.getImageUrl() != null) {
            fileStorageService.deleteImage(product.getImageUrl());
            product.setImageUrl(null);
            productRepository.save(product);
        }

        log.info("Deleted image for product {}", id);
        return ResponseEntity.ok(ApiResponse.ok(ProductResponse.from(product), "Image deleted"));
    }

    // ── User management ───────────────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "List all users (ADMIN)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(
                page, Math.min(size, 100),
                org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<UserResponse> users = userRepository.findAll(pageable).map(UserResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Change a user's role (ADMIN)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        String role = body.get("role");
        if (role != null && (role.equals("USER") || role.equals("ADMIN"))) {
            user.setRole(role);
            userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.ok(UserResponse.from(user)));
    }
}
