package NexVault.dto.response;

import NexVault.model.Review;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only response DTO for a {@link Review}.
 *
 * @param id        UUID of the review
 * @param userId    UUID of the reviewer
 * @param userName  display name of the reviewer
 * @param rating    star rating 1–5
 * @param comment   optional short review text
 * @param createdAt when the review was first submitted
 * @param updatedAt when the review was last edited
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReviewResponse(
        UUID id,
        UUID userId,
        String userName,
        Integer rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ReviewResponse from(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
