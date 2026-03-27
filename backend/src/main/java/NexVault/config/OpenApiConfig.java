package NexVault.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SpringDoc / OpenAPI 3 configuration for the HashVault API.
 *
 * <p>Registers an {@link OpenAPI} bean that populates the Swagger UI header
 * with the project title, version, and a short description.  The Swagger UI
 * is accessible at {@code /swagger-ui.html} once the application is running.</p>
 */
@Configuration
public class OpenApiConfig {

    /**
     * Builds the root {@link OpenAPI} definition consumed by Swagger UI and
     * the machine-readable spec served at {@code /api-docs}.
     *
     * @return a configured {@link OpenAPI} instance with HashVault API metadata
     */
    @Bean
    public OpenAPI hashVaultOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HashVault API")
                        .version("1.0.0")
                        .description("REST API for HashVault – a digital goods marketplace " +
                                "offering gift cards, in-game currency, streaming subscriptions, " +
                                "and VPN/software products. Phase 1: public product catalogue."));
    }
}
