package Raidzone.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Generic API response envelope used by every endpoint in HashVault.
 *
 * <p>All responses share this structure so that the frontend can handle
 * success and error cases uniformly:</p>
 * <pre>
 * {
 *   "success"   : true | false,
 *   "data"      : &lt;payload or null&gt;,
 *   "message"   : "OK" | "&lt;error description&gt;",
 *   "timestamp" : "2024-11-01T12:34:56.789Z"
 * }
 * </pre>
 *
 * <p>Null {@code data} fields are excluded from the serialised JSON when
 * {@code success} is {@code false}, keeping error responses concise.</p>
 *
 * @param <T> type of the payload wrapped in the {@code data} field
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        String timestamp
) {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                    .withZone(ZoneOffset.UTC);

    /**
     * Creates a successful response with the given payload and the default
     * message {@code "OK"}.
     *
     * @param <T>  type of the payload
     * @param data the payload to wrap; may be {@code null}
     * @return a new {@code ApiResponse} with {@code success = true}
     */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, "OK", now());
    }

    /**
     * Creates a successful response with the given payload and a custom message.
     *
     * @param <T>     type of the payload
     * @param data    the payload to wrap; may be {@code null}
     * @param message a human-readable message describing the result
     * @return a new {@code ApiResponse} with {@code success = true}
     */
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, now());
    }

    /**
     * Creates an error response with a descriptive message and {@code null} data.
     *
     * @param <T>     inferred generic type parameter (always {@code null} data)
     * @param message a human-readable description of what went wrong
     * @return a new {@code ApiResponse} with {@code success = false} and {@code data = null}
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message, now());
    }

    /**
     * Returns the current UTC instant formatted as an ISO-8601 string.
     *
     * @return timestamp string, e.g. {@code "2024-11-01T12:34:56.789Z"}
     */
    private static String now() {
        return FORMATTER.format(Instant.now());
    }
}
