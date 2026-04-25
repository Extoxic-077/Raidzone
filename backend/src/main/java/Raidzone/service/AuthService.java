package Raidzone.service;

import Raidzone.dto.request.LoginRequest;
import Raidzone.dto.request.RegisterRequest;
import Raidzone.dto.request.UpdateProfileRequest;
import Raidzone.dto.response.AuthResponse;
import Raidzone.dto.response.UserResponse;
import Raidzone.exception.DuplicateResourceException;
import Raidzone.exception.ResourceNotFoundException;
import Raidzone.exception.UnauthorizedException;
import Raidzone.model.User;
import Raidzone.repository.UserRepository;
import Raidzone.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
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
     * Step 1 of OTP login: validates credentials, returns the user if valid.
     * Does NOT issue a JWT — caller should send OTP after this.
     */
    @Transactional(readOnly = true)
    public User validateCredentials(String email, String password) {
        User user = userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return user;
    }

    /**
     * Finds an active user by email. Used by OTP verify and resend flows.
     */
    @Transactional(readOnly = true)
    public User findActiveUserByEmail(String email) {
        return userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new UnauthorizedException("No active account found for this email"));
    }

    /**
     * Marks a user's email as verified.
     */
    @Transactional
    public void markEmailVerified(User user) {
        user.setIsEmailVerified(true);
        userRepository.save(user);
    }

    /**
     * Finds a user by email regardless of active status (for OAuth linking).
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Saves a user entity (used by OAuth service to create/update users).
     */
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    /**
     * @deprecated Use OTP-based login flow. Kept for internal use only.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = validateCredentials(request.email(), request.password());
        log.info("User logged in (legacy): {} ({})", user.getEmail(), user.getId());
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

    // ── Public helpers (used by OAuth + OTP controllers) ─────────────────────

    /**
     * Public wrapper around {@link #buildAuthResponse} for use by external controllers.
     */
    public AuthResponse buildAuthResponsePublic(User user) {
        return buildAuthResponse(user);
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
        if (request.postalCode() != null) {
            user.setPostalCode(request.postalCode().isBlank() ? null : request.postalCode());
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

    /**
     * Finds an active user by ID (used by OTP-based change flows).
     */
    @Transactional(readOnly = true)
    public User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    /**
     * Validates that the new email is not taken before the email-change OTP is sent.
     * Returns the user entity so the controller can pass it to OtpService.
     *
     * @throws DuplicateResourceException if the new email is already registered to a different account
     */
    @Transactional(readOnly = true)
    public User prepareEmailChange(UUID userId, String newEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (userRepository.existsByEmail(newEmail) && !newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new DuplicateResourceException("User", "email", newEmail);
        }
        return user;
    }

    /**
     * Applies an email change after OTP verification (called by controller after
     * {@link OtpService#verify} succeeds for purpose "EMAIL_CHANGE").
     *
     * @param userId   the authenticated user
     * @param newEmail the new email address (already OTP-verified)
     * @return updated {@link UserResponse}
     */
    @Transactional
    public UserResponse verifyEmailChange(UUID userId, String newEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (userRepository.existsByEmail(newEmail) && !newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new DuplicateResourceException("User", "email", newEmail);
        }

        user.setEmail(newEmail);
        user = userRepository.save(user);
        log.info("User {} changed email to {}", userId, newEmail);
        return UserResponse.from(user);
    }

    /**
     * Applies a password change after OTP verification (called by controller after
     * {@link OtpService#verify} succeeds for purpose "PASSWORD_CHANGE").
     *
     * @param userId      the authenticated user
     * @param newPassword the new plain-text password (will be hashed)
     */
    @Transactional
    public void changePassword(UUID userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("User {} changed password", userId);
    }

    /**
     * Finds an active user by email, returning empty Optional silently
     * (used for forgot-password — never reveal whether an account exists).
     */
    @Transactional(readOnly = true)
    public Optional<User> findActiveByEmailSilent(String email) {
        return userRepository.findByEmailAndIsActiveTrue(email);
    }

    /**
     * Resets the password after forgot-password OTP verification.
     */
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired reset link"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password reset for user {}", email);
    }
}
