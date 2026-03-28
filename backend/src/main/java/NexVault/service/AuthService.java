package NexVault.service;

import NexVault.dto.request.LoginRequest;
import NexVault.dto.request.RegisterRequest;
import NexVault.dto.request.UpdateProfileRequest;
import NexVault.dto.response.AuthResponse;
import NexVault.dto.response.UserResponse;
import NexVault.exception.DuplicateResourceException;
import NexVault.exception.ResourceNotFoundException;
import NexVault.exception.UnauthorizedException;
import NexVault.model.User;
import NexVault.repository.UserRepository;
import NexVault.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Business logic for user registration, login, token refresh, and profile retrieval.
 *
 * <p>All public methods that modify state are wrapped in a transaction.
 * Read-only lookups use {@code @Transactional(readOnly = true)} for performance.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Registers a new user account.
     *
     * <p>Validates uniqueness of email and (if provided) nickname, hashes the
     * password, persists the user, then issues an access token and refresh token.</p>
     *
     * @param request the registration payload
     * @return {@link AuthResponse} containing the access token and user profile
     * @throws DuplicateResourceException if the email or nickname is already taken
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("User", "email", request.email());
        }

        if (request.nickname() != null && !request.nickname().isBlank()
                && userRepository.existsByNickname(request.nickname())) {
            throw new DuplicateResourceException("User", "nickname", request.nickname());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setName(request.name());
        user.setPhone(request.phone());
        user.setNickname(request.nickname());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        user.setProvider("LOCAL");
        user.setIsEmailVerified(false);
        user.setIsActive(true);

        user = userRepository.save(user);
        log.info("Registered new user: {} ({})", user.getEmail(), user.getId());

        return buildAuthResponse(user);
    }

    /**
     * Authenticates a user with email and password.
     *
     * @param request the login credentials
     * @return {@link AuthResponse} containing the access token and user profile
     * @throws UnauthorizedException if the credentials are invalid or the account is inactive
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailAndIsActiveTrue(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        log.info("User logged in: {} ({})", user.getEmail(), user.getId());
        return buildAuthResponse(user);
    }

    /**
     * Issues a new access token from a valid refresh token.
     *
     * @param refreshToken the refresh JWT from the HttpOnly cookie
     * @return new {@link AuthResponse} with a fresh access token
     * @throws UnauthorizedException if the refresh token is invalid or expired
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        UUID userId;
        try {
            userId = jwtUtil.getUserIdFromToken(refreshToken);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        User user = userRepository.findById(userId)
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .orElseThrow(() -> new UnauthorizedException("User not found or inactive"));

        return buildAuthResponse(user);
    }

    /**
     * Retrieves the public profile of an authenticated user.
     *
     * @param userId the UUID extracted from the JWT by the security filter
     * @return the user's {@link UserResponse}
     * @throws ResourceNotFoundException if the user does not exist
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return UserResponse.from(user);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Builds a complete {@link AuthResponse} for the given user by generating
     * fresh access and refresh tokens.
     *
     * @param user the authenticated/registered user entity
     * @return the fully populated auth response
     */
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        // refresh token is returned separately (controller sets it as cookie)
        jwtUtil.generateRefreshToken(user.getId());
        long expiresIn = jwtUtil.getAccessTokenExpiry() / 1000;
        return new AuthResponse(accessToken, "Bearer", expiresIn, UserResponse.from(user));
    }

    /**
     * Updates mutable profile fields (name, phone, nickname) for an authenticated user.
     *
     * @param userId  the UUID of the user to update
     * @param request the fields to update (all optional — null means no change)
     * @return the updated {@link UserResponse}
     * @throws DuplicateResourceException if the requested nickname is already taken
     * @throws ResourceNotFoundException  if the user no longer exists
     */
    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.nickname() != null && !request.nickname().isBlank()
                && !request.nickname().equals(user.getNickname())
                && userRepository.existsByNickname(request.nickname())) {
            throw new DuplicateResourceException("User", "nickname", request.nickname());
        }

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone().isBlank() ? null : request.phone());
        }
        if (request.nickname() != null) {
            user.setNickname(request.nickname().isBlank() ? null : request.nickname());
        }

        user = userRepository.save(user);
        log.info("User {} updated profile", userId);
        return UserResponse.from(user);
    }

    /**
     * Generates a refresh token for the given user (called by the controller
     * to set the HttpOnly cookie value).
     *
     * @param userId the user's UUID
     * @return the signed refresh JWT string
     */
    public String generateRefreshToken(UUID userId) {
        return jwtUtil.generateRefreshToken(userId);
    }
}
