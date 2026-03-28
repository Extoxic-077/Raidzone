package NexVault.exception;

import NexVault.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Centralised exception handler for all controllers in HashVault.
 *
 * <p>Catches the three categories of exceptions that can arise during a request
 * and converts each to a standard {@link ApiResponse} envelope so the frontend
 * always receives the same JSON structure regardless of the error type.</p>
 *
 * <ul>
 *   <li>{@link ResourceNotFoundException} → 404 Not Found</li>
 *   <li>{@link MethodArgumentNotValidException} → 400 Bad Request (field validation errors)</li>
 *   <li>Any other {@link Exception} → 500 Internal Server Error</li>
 * </ul>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles {@link ResourceNotFoundException}: logs a WARN and returns 404.
     *
     * @param ex      the exception carrying the entity type and identifier
     * @param request the current HTTP request (used for logging context)
     * @return 404 response with an {@link ApiResponse} error envelope
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        log.warn("Resource not found [{} {}]: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles {@link MethodArgumentNotValidException}: aggregates all field
     * validation errors into one comma-separated message and returns 400.
     *
     * @param ex      the exception containing the binding result with field errors
     * @param request the current HTTP request
     * @return 400 response with an {@link ApiResponse} error envelope listing all violations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));

        log.warn("Validation failed [{} {}]: {}",
                request.getMethod(), request.getRequestURI(), errors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(errors));
    }

    /**
     * Handles {@link DuplicateResourceException}: logs a WARN and returns 409 Conflict.
     *
     * @param ex      the exception carrying the duplicate field details
     * @param request the current HTTP request
     * @return 409 response with an {@link ApiResponse} error envelope
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicate(
            DuplicateResourceException ex,
            HttpServletRequest request) {

        log.warn("Duplicate resource [{} {}]: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles {@link UnauthorizedException}: logs a WARN and returns 401 Unauthorized.
     *
     * @param ex      the exception carrying the auth failure reason
     * @param request the current HTTP request
     * @return 401 response with an {@link ApiResponse} error envelope
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
            UnauthorizedException ex,
            HttpServletRequest request) {

        log.warn("Unauthorized [{} {}]: {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Catch-all handler for unexpected exceptions: logs the full stack trace at
     * ERROR level (including the HTTP method and URL) and returns 500.
     *
     * @param ex      the unexpected exception
     * @param request the current HTTP request
     * @return 500 response with a generic {@link ApiResponse} error envelope
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unexpected error [{} {}]", request.getMethod(), request.getRequestURI(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again later."));
    }
}
