package Raidzone.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Static resource handler for uploaded product images.
 *
 * <p>Maps the URL pattern {@code /uploads/**} to the filesystem directory
 * configured via {@code app.upload.dir} so that images stored there are
 * publicly accessible without a controller.</p>
 *
 * <p>Example: a file saved at {@code ./uploads/products/steam-wallet-123.webp}
 * is served at {@code http://localhost:8080/uploads/products/steam-wallet-123.webp}.</p>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadDir;

    /**
     * Injects the upload directory path from application configuration.
     *
     * @param uploadDir the root upload directory (from {@code app.upload.dir})
     */
    public WebConfig(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    /**
     * Registers a resource handler that serves files from the upload directory.
     *
     * @param registry the Spring MVC resource handler registry
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
