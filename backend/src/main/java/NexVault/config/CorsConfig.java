package NexVault.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration for the HashVault API.
 *
 * <p>Exposes a {@link CorsConfigurationSource} bean so that both Spring Security
 * (which runs before the MVC layer) and Spring MVC share the same CORS rules.
 * Without this, CORS pre-flight OPTIONS requests would be blocked by the security
 * filter chain before reaching the MVC CORS handler.</p>
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:*}")
    private String allowedOriginsRaw;

    /**
     * Defines the CORS policy applied to every endpoint.
     *
     * <p>Reads allowed origins from {@code app.cors.allowed-origins} (comma-separated).
     * Defaults to {@code http://localhost:*} for local development.
     * Set {@code CORS_ALLOWED_ORIGINS} env var in production to include Cloud Run URLs.</p>
     *
     * @return a {@link CorsConfigurationSource} used by both Spring Security and Spring MVC
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
