package NexVault.controller;

import NexVault.dto.request.CreateCategoryRequest;
import NexVault.dto.request.CreateProductRequest;
import NexVault.dto.request.UpdateProductRequest;
import NexVault.dto.response.*;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Category;
import NexVault.model.Product;
import NexVault.model.User;
import NexVault.repository.*;
import NexVault.service.AdminProductService;
import NexVault.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.Year;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only operations (requires ADMIN role)")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PurchaseRepository purchaseRepository;
    private final FileStorageService fileStorageService;
    private final AdminProductService adminProductService;
    private final OrderRepository orderRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponRepository couponRepository;

    // ── Dashboard stats ───────────────────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics (ADMIN)")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        long totalUsers      = userRepository.count();
        long totalProducts   = productRepository.count();
        long activeProducts  = productRepository.countByIsActiveTrue();
        long totalCategories = categoryRepository.count();
        return ResponseEntity.ok(ApiResponse.ok(
                new DashboardStatsResponse(totalUsers, totalProducts, activeProducts, totalCategories)));
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    /**
     * period values: THIS_MONTH, PREV_MONTH, THIS_YEAR, PREV_YEAR
     */
    @GetMapping("/analytics")
    @Operation(summary = "Get sales analytics (ADMIN)")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics(
            @RequestParam(defaultValue = "THIS_MONTH") String period) {

        LocalDateTime[] range = resolvePeriod(period);
        LocalDateTime from = range[0];
        LocalDateTime to   = range[1];

        // Legacy purchase-based stats
        long totalSales    = purchaseRepository.countByCreatedAtBetween(from, to);
        Double rev         = purchaseRepository.sumRevenueByDateRange(from, to);
        double totalRevenue = rev != null ? rev : 0.0;

        List<Object[]> topRaw  = purchaseRepository.findTopProductsByDateRange(from, to);
        List<Object[]> dailyRaw = purchaseRepository.findDailySalesByDateRange(from, to);

        List<AnalyticsResponse.ProductSalesItem> topProducts = topRaw.stream().map(row -> {
            String pid      = row[0] != null ? row[0].toString() : "";
            String pname    = row[1] != null ? row[1].toString() : "";
            String catName  = row[2] != null ? row[2].toString() : "";
            long cnt        = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            double revenue  = row[4] != null ? ((Number) row[4]).doubleValue() : 0.0;
            return new AnalyticsResponse.ProductSalesItem(pid, pname, catName, cnt, revenue);
        }).toList();

        List<AnalyticsResponse.DailySalesItem> salesByDate = dailyRaw.stream().map(row -> {
            String date    = row[0] != null ? row[0].toString() : "";
            long cnt       = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            double revenue = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            return new AnalyticsResponse.DailySalesItem(date, cnt, revenue);
        }).toList();

        // Order-based stats
        long totalOrders = orderRepository.countByCreatedAtBetween(from, to);
        long paidOrders  = orderRepository.countConfirmedByDateRange(from, to);

        Double confirmedRev = orderRepository.sumConfirmedRevenueByDateRange(from, to);
        double orderRevenue = confirmedRev != null ? confirmedRev : 0.0;
        double avgOrderValue = paidOrders > 0 ? orderRevenue / paidOrders : 0.0;

        List<Object[]> revenueByProviderRaw = orderRepository.findRevenueByProviderInRange(from, to);
        Map<String, Double> revenueByProvider = new LinkedHashMap<>();
        for (Object[] row : revenueByProviderRaw) {
            String provider = row[0] != null ? row[0].toString() : "UNKNOWN";
            double amount   = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            revenueByProvider.put(provider, amount);
        }

        List<Object[]> ordersByStatusRaw = orderRepository.findOrdersByStatusInRange(from, to);
        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (Object[] row : ordersByStatusRaw) {
            String status = row[0] != null ? row[0].toString() : "UNKNOWN";
            long count    = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            ordersByStatus.put(status, count);
        }

        // New users in period
        long newUsers = userRepository.countByCreatedAtBetween(from, to);

        // Coupon usage stats
        long couponUsageCount = couponUsageRepository.countByUsedAtBetween(from, to);

        List<Object[]> topCouponsRaw = couponUsageRepository.findTopCouponsByDateRange(
                from, to, PageRequest.of(0, 5));
        List<AnalyticsResponse.TopCouponItem> topCoupons = topCouponsRaw.stream().map(row -> {
            String code        = row[0] != null ? row[0].toString() : "";
            long usageCount    = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            double totalDiscount = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            return new AnalyticsResponse.TopCouponItem(code, usageCount, totalDiscount);
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok(new AnalyticsResponse(
                totalSales, totalRevenue, topProducts, salesByDate,
                totalOrders, paidOrders, revenueByProvider, ordersByStatus, avgOrderValue,
                newUsers, couponUsageCount, topCoupons)));
    }

    private LocalDateTime[] resolvePeriod(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period) {
            case "PREV_MONTH" -> {
                YearMonth prev = YearMonth.now().minusMonths(1);
                yield new LocalDateTime[]{ prev.atDay(1).atStartOfDay(), prev.atEndOfMonth().atTime(23, 59, 59) };
            }
            case "THIS_YEAR" -> {
                int y = Year.now().getValue();
                yield new LocalDateTime[]{ LocalDateTime.of(y, 1, 1, 0, 0), now };
            }
            case "PREV_YEAR" -> {
                int y = Year.now().getValue() - 1;
                yield new LocalDateTime[]{ LocalDateTime.of(y, 1, 1, 0, 0), LocalDateTime.of(y, 12, 31, 23, 59, 59) };
            }
            default -> { // THIS_MONTH
                YearMonth cur = YearMonth.now();
                yield new LocalDateTime[]{ cur.atDay(1).atStartOfDay(), now };
            }
        };
    }

    // ── Product management ────────────────────────────────────────────────────

    @GetMapping("/products")
    @Operation(summary = "List all products including inactive (ADMIN)")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminProductService.listAll(page, size)));
    }

    @PostMapping("/products")
    @Operation(summary = "Create a new product (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody CreateProductRequest req) {
        ProductResponse created = adminProductService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Product created"));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update an existing product (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminProductService.update(id, req)));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Soft-delete a product (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        adminProductService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product deactivated"));
    }

    @PostMapping("/products/{id}/image")
    @Transactional
    @Operation(summary = "Upload a product image (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> uploadProductImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (product.getImageUrl() != null) {
            fileStorageService.deleteImage(product.getImageUrl());
        }
        String imageUrl = fileStorageService.storeProductImage(file, product.getSlug());
        product.setImageUrl(imageUrl);
        productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok(ProductResponse.from(product), "Image uploaded successfully"));
    }

    @DeleteMapping("/products/{id}/image")
    @Transactional
    @Operation(summary = "Delete a product image (ADMIN)")
    public ResponseEntity<ApiResponse<ProductResponse>> deleteProductImage(@PathVariable UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (product.getImageUrl() != null) {
            fileStorageService.deleteImage(product.getImageUrl());
            product.setImageUrl(null);
            productRepository.save(product);
        }
        return ResponseEntity.ok(ApiResponse.ok(ProductResponse.from(product), "Image deleted"));
    }

    // ── Category management ───────────────────────────────────────────────────

    @GetMapping("/categories")
    @Operation(summary = "List all categories including inactive (ADMIN)")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> listCategories() {
        List<CategoryResponse> categories = categoryRepository
                .findAll(org.springframework.data.domain.Sort.by("sortOrder").ascending())
                .stream()
                .map(CategoryResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping("/categories")
    @Transactional
    @Operation(summary = "Create a new category (ADMIN)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest req) {
        Category cat = new Category();
        cat.setName(req.name());
        cat.setSlug(req.slug());
        cat.setDescription(req.description());
        cat.setEmoji(req.emoji());
        cat.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        cat.setIsActive(req.isActive() != null ? req.isActive() : true);
        categoryRepository.save(cat);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(CategoryResponse.from(cat), "Category created"));
    }

    @PutMapping("/categories/{id}")
    @Transactional
    @Operation(summary = "Update a category (ADMIN)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        cat.setName(req.name());
        cat.setSlug(req.slug());
        cat.setDescription(req.description());
        cat.setEmoji(req.emoji());
        if (req.sortOrder() != null) cat.setSortOrder(req.sortOrder());
        if (req.isActive() != null)  cat.setIsActive(req.isActive());
        categoryRepository.save(cat);
        return ResponseEntity.ok(ApiResponse.ok(CategoryResponse.from(cat)));
    }

    @DeleteMapping("/categories/{id}")
    @Transactional
    @Operation(summary = "Deactivate a category (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        cat.setIsActive(false);
        categoryRepository.save(cat);
        return ResponseEntity.ok(ApiResponse.ok(null, "Category deactivated"));
    }

    // ── User management ───────────────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "List all users (ADMIN)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(
                page, Math.min(size, 100),
                org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<UserResponse> users = userRepository.findAll(pageable).map(UserResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Change a user's role (ADMIN)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        String role = body.get("role");
        if (role != null && (role.equals("USER") || role.equals("ADMIN"))) {
            user.setRole(role);
            userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.ok(UserResponse.from(user)));
    }

    @PutMapping("/users/{id}/status")
    @Transactional
    @Operation(summary = "Toggle a user's active status (ADMIN)")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        Boolean active = body.get("isActive");
        if (active != null) {
            user.setIsActive(active);
            userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.ok(UserResponse.from(user)));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    @Operation(summary = "Permanently delete a user (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "User deleted"));
    }
}
