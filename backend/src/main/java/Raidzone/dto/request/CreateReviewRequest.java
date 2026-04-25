package Raidzone.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating or updating a product review.
 *
 * @param rating  star rating 1–5 (required)
 * @param comment optional short description, max 255 characters
 */
public record CreateReviewRequest(

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        Integer rating,

        @Size(max = 255, message = "Comment must be 255 characters or fewer")
        String comment
) {}
