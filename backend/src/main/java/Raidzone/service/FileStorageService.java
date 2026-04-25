package Raidzone.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

/**
 * Service for storing and deleting product image files on the local filesystem.
 *
 * <p>Uploaded files are saved under {@code {upload-dir}/products/} and served as
 * static resources via {@link Raidzone.config.WebConfig}.  The public URL path
 * returned is relative: {@code /uploads/products/{filename}}.</p>
 */
@Slf4j
@Service
public class FileStorageService {

    private final Path uploadRoot;
    private final List<String> allowedTypes;

    /**
     * Constructs the service from configuration values.
     *
     * @param uploadDir    root directory for all uploads (from {@code app.upload.dir})
     * @param allowedTypes comma-separated list of allowed MIME types
     */
    public FileStorageService(
            @Value("${app.upload.dir}") String uploadDir,
            @Value("${app.upload.allowed-types}") String allowedTypes) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.allowedTypes = Arrays.asList(allowedTypes.split(","));
    }

    /**
     * Creates the upload directory tree on application startup if it does not exist.
     */
    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadRoot.resolve("products"));
            log.info("Upload directory ready: {}", uploadRoot.resolve("products"));
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directories", e);
        }
    }

    /**
     * Validates and stores a product image, returning its public URL path.
     *
     * <p>The filename is generated as {@code {slug}-{timestamp}.{extension}} to
     * avoid collisions and prevent directory traversal via the original filename.</p>
     *
     * @param file the uploaded file
     * @param slug the product slug used as the filename prefix
     * @return the relative URL path (e.g. {@code /uploads/products/steam-wallet-1234567890.webp})
     * @throws IllegalArgumentException if the file is empty, has an unsupported type, or no extension
     * @throws IOException              if the file cannot be saved
     */
    public String storeProductImage(MultipartFile file, String slug) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException(
                    "File type not allowed: " + contentType + ". Allowed: " + allowedTypes);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);

        String filename = slug + "-" + System.currentTimeMillis() + "." + extension;
        Path targetPath = uploadRoot.resolve("products").resolve(filename);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Stored product image: {}", targetPath);

        return "/uploads/products/" + filename;
    }

    /**
     * Deletes an image file from the filesystem given its public URL path.
     *
     * <p>If the file does not exist the method returns silently.</p>
     *
     * @param imageUrl the relative URL path (e.g. {@code /uploads/products/foo.webp})
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            // Strip the leading slash and resolve relative to upload root's parent
            String relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
            Path filePath = uploadRoot.getParent().resolve(relativePath).normalize();
            Files.deleteIfExists(filePath);
            log.info("Deleted image: {}", filePath);
        } catch (IOException e) {
            log.warn("Failed to delete image {}: {}", imageUrl, e.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Extracts the lowercase file extension from an original filename.
     *
     * @param filename the original filename from the upload
     * @return the extension without dot (e.g. {@code "webp"})
     * @throws IllegalArgumentException if the filename has no extension
     */
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("File has no extension");
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
