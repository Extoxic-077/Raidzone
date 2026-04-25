package NexVault.config;

import NexVault.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for HashVault Phase 2.
 *
 * <p>Registers the {@link JwtAuthenticationFilter} to parse Bearer tokens on every
 * request, configures per-path authorisation rules, and keeps the session policy
 * stateless (all state lives in the JWT).</p>
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * BCrypt password encoder bean used by {@link NexVault.service.AuthService}.
     *
     * @return a {@link BCryptPasswordEncoder} with default strength (10)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Builds the {@link SecurityFilterChain} governing all incoming HTTP requests.
     *
     * <p>Authorisation rules:
     * <ul>
     *   <li>Public: auth endpoints, product/category reads, uploads, Swagger, actuator</li>
     *   <li>ADMIN only: everything under {@code /api/v1/admin/**}</li>
     *   <li>Authenticated: all other requests</li>
     * </ul>
     * </p>
     *
     * @param http the {@link HttpSecurity} builder
     * @return the configured {@link SecurityFilterChain}
     * @throws Exception if any security configuration step fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/v1/public/**", "/ws/**").permitAll()
                    // ── Auth (public) ────────────────────────────────────────────
                    .requestMatchers(
                            "/api/v1/auth/register",
                            "/api/v1/auth/login",
                            "/api/v1/auth/verify-otp",
                            "/api/v1/auth/verify-email",
                            "/api/v1/auth/resend-otp",
                            "/api/v1/auth/refresh",
                            "/api/v1/auth/logout",
                            "/api/v1/auth/oauth/**",
                            "/api/v1/auth/forgot-password",
                            "/api/v1/auth/reset-password"
                    ).permitAll()
                    // ── Public read-only product catalogue ───────────────────────
                    .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/companies/**").permitAll()
                    // ── Static uploaded files ────────────────────────────────────
                    .requestMatchers("/uploads/**").permitAll()
                    // ── OpenAPI / Swagger ────────────────────────────────────────
                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**").permitAll()
                    // ── Actuator ─────────────────────────────────────────────────
                    .requestMatchers("/actuator/**").permitAll()
                    // ── Payment config + webhooks (public — reached without JWT) ──
                    .requestMatchers(HttpMethod.GET, "/api/v1/payments/stripe/config").permitAll()
                    .requestMatchers("/api/v1/payments/stripe/webhook").permitAll()
                    .requestMatchers("/api/v1/payments/coinbase/webhook").permitAll()
                    // ── Newsletter subscribe/unsubscribe (public) ────────────────
                    .requestMatchers("/api/v1/subscribe").permitAll()
                    // ── Contact / Partnership forms (public) ─────────────────────
                    .requestMatchers("/api/v1/contact", "/api/v1/partnerships").permitAll()
                    // ── Discord bot reply (secured by bot secret in body) ─────────
                    .requestMatchers("/api/v1/chat/discord-reply").permitAll()
                    // ── Notifications (requires authentication) ──────────────────
                    .requestMatchers("/api/v1/notifications/**").authenticated()
                    // ── My Keys (requires authentication) ────────────────────────
                    .requestMatchers("/api/v1/my-keys/**").authenticated()
                    // ── Admin (requires ADMIN role) ──────────────────────────────
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    // ── Everything else requires authentication ──────────────────
                    .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
