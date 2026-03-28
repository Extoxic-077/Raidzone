package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.dto.response.ProductResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Product;
import NexVault.repository.ProductRepository;
import NexVault.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
    private final FileStorageService fileStorageService;

    /**
     * Uploads a product image and persists the URL in the product record.
     *
     * @param id   the product UUID
     * @param file the image file (JPEG, PNG, WebP, or GIF; max 5 MB)
     * @return the updated {@link ProductResponse} with the new {@code imageUrl}
     * @throws ResourceNotFoundException if the product does not exist
     * @throws IOException               if the file cannot be saved
     */
    @PostMapping("/products/{id}/image")
    @Operation(summary = "Upload a product image (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> uploadProductImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        String imageUrl = fileStorageService.storeProductImage(file, product.getSlug());

        // Delete old image if one existed
        if (product.getImageUrl() != null) {
            fileStorageService.deleteImage(product.getImageUrl());
        }

        product.setImageUrl(imageUrl);
        productRepository.save(product);

        log.info("Updated image for product {} → {}", id, imageUrl);
        return ResponseEntity.ok(ApiResponse.ok(ProductResponse.from(product), "Image uploaded successfully"));
    }

    /**
     * Removes the product image from both the filesystem and the product record.
     *
     * @param id the product UUID
     * @return the updated {@link ProductResponse} with {@code imageUrl} set to null
     * @throws ResourceNotFoundException if the product does not exist
     */
    @DeleteMapping("/products/{id}/image")
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
}
