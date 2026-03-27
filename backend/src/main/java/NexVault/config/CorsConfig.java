package NexVault.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration for the HashVault API.
 *
 * <p>Phase 1 intentionally allows all origins, methods, and headers so that
 * the React frontend (running on any localhost port or deployed origin) can
 * reach the API without CORS errors during development and staging.</p>
 *
 * <p><strong>Note:</strong> Before going to production this class should be
 * replaced with origin allow-list restricted to the canonical frontend URL.</p>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Registers a permissive CORS mapping that applies to every API path.
     *
     * <p>Allows all origins, all HTTP methods, all headers, and enables
     * pre-flight response caching for 1 hour.</p>
     *
     * @param registry the Spring MVC CORS registry to configure
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
