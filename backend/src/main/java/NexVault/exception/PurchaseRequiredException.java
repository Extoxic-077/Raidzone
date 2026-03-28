package NexVault.exception;

/** Thrown when a user tries to review a product they have not purchased. */
public class PurchaseRequiredException extends RuntimeException {
    public PurchaseRequiredException() {
        super("You must purchase this product before leaving a review.");
    }
}
