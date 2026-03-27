package NexVault.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security configuration for Phase 1 of HashVault.
 *
 * <p>Phase 1 only exposes a public read-only product catalogue, so all requests
 * are permitted without authentication.  CSRF protection and session management
 * are disabled because the API is fully stateless.</p>
 *
 * <p>Phase 2 will replace {@code anyRequest().permitAll()} with role-based rules
 * once JWT authentication and the user registration endpoints are added.</p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Builds the {@link SecurityFilterChain} that governs all incoming HTTP requests.
     *
     * <p>Current rules:
     * <ul>
     *   <li>CSRF disabled (stateless REST API – no session cookies)</li>
     *   <li>Session creation policy: STATELESS</li>
     *   <li>All requests are permitted without credentials</li>
     * </ul>
     * </p>
     *
     * @param http the {@link HttpSecurity} builder provided by Spring Security
     * @return the fully configured {@link SecurityFilterChain}
     * @throws Exception if any security configuration step fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}
