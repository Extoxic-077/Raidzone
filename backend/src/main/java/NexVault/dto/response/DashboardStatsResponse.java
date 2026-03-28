package NexVault.dto.response;

/**
 * Admin dashboard statistics snapshot.
 */
public record DashboardStatsResponse(
        long totalUsers,
        long totalProducts,
        long activeProducts,
        long totalCategories
) {}
