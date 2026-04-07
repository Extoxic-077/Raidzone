package NexVault.dto.response;

import java.util.List;
import java.util.Map;

public record AnalyticsResponse(
        long totalSales,
        double totalRevenue,
        List<ProductSalesItem> topProducts,
        List<DailySalesItem> salesByDate,
        long totalOrders,
        long paidOrders,
        Map<String, Double> revenueByProvider,
        Map<String, Long> ordersByStatus,
        double avgOrderValue,
        long newUsers,
        long couponUsageCount,
        List<TopCouponItem> topCoupons
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

    public record TopCouponItem(String code, long usageCount, double totalDiscount) {}
}
