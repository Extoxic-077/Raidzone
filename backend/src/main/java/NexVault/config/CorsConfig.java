package NexVault.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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

    /**
     * Defines the CORS policy applied to every endpoint.
     *
     * <p>Allows all {@code http://localhost:*} origins (covers any dev port),
     * all standard HTTP methods, all headers, and credentials (needed for
     * the HttpOnly refresh-token cookie).</p>
     *
     * @return a {@link CorsConfigurationSource} used by both Spring Security and Spring MVC
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
