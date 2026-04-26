package NexVault.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Servlet filter that extracts and validates a JWT from the {@code Authorization} header.
 *
 * <p>If a valid token is found the filter populates the {@link SecurityContextHolder}
 * with a {@link UsernamePasswordAuthenticationToken} whose principal is the user's
 * {@link UUID} and whose single authority is {@code ROLE_<ROLE>}.  If the token is
 * missing or invalid the request proceeds unauthenticated — downstream security rules
 * decide whether to reject it.</p>
 *
 * <p>The filter skips itself for public paths (auth endpoints, Swagger, actuator,
 * static uploads) to avoid unnecessary token parsing overhead.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private static final List<String> SKIP_PATHS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/swagger-ui/**",
            "/api-docs/**",
            "/actuator/**",
            "/uploads/**",
            "/api/v1/public/**",
            "/ws/**"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * Skips this filter for paths that never require authentication.
     *
     * @param request the incoming HTTP request
     * @return {@code true} if the request path matches one of the skip patterns
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return SKIP_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    /**
     * Reads the {@code Authorization: Bearer <token>} header, validates the token,
     * and sets the authentication in the security context if valid.
     *
     * @param request     the incoming HTTP request
     * @param response    the HTTP response
     * @param filterChain the remaining filter chain
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.validateToken(token);
                UUID userId = UUID.fromString(claims.getSubject());
                String role = claims.get("role", String.class);

                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException e) {
                log.debug("Invalid JWT token [{}]: {}", request.getRequestURI(), e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
