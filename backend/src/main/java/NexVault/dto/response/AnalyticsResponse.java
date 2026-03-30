package NexVault.dto.response;

import java.util.List;

public record AnalyticsResponse(
        long totalSales,
        double totalRevenue,
        List<ProductSalesItem> topProducts,
        List<DailySalesItem> salesByDate
) {
    public record ProductSalesItem(
            String productId,
            String productName,
            String categoryName,
            long salesCount,
            double revenue
    ) {}

    public record DailySalesItem(
            String date,
            long count,
            double revenue
    ) {}
}
