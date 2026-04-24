package NexVault.controller;

import NexVault.dto.request.AdminCreateCouponRequest;
import NexVault.dto.response.*;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Coupon;
import NexVault.model.CouponType;
import NexVault.model.Payment;
import NexVault.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.lang.management.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin - Orders & Commerce", description = "Admin endpoints for orders, coupons, payments, products and system health")
@SecurityRequirement(name = "bearerAuth")
public class AdminOrderController {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final ProductRepository productRepository;
    private final EntityManager entityManager;
    private final DataSource dataSource;

    // ── Orders ────────────────────────────────────────────────────────────────

    @GetMapping("/orders")
    @Operation(summary = "List all orders with optional status/search filter (ADMIN)")
    public ResponseEntity<ApiResponse<Page<AdminOrderResponse>>> listOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Sort is embedded in the native SQL query (ORDER BY created_at DESC)
        var pageable = PageRequest.of(page, Math.min(size, 100));
        Page<AdminOrderResponse> result = orderRepository
                .findAllAdmin(status, search, pageable)
                .map(AdminOrderResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/orders/{orderId}")
    @Operation(summary = "Get order detail with items and payment (ADMIN)")
    public ResponseEntity<ApiResponse<AdminOrderDetailResponse>> getOrder(@PathVariable UUID orderId) {
        var order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        var payment = paymentRepository.findByOrder_Id(orderId)
                .map(AdminPaymentResponse::from)
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(AdminOrderDetailResponse.from(order, payment)));
    }

    @PutMapping("/orders/{orderId}/status")
    @Transactional
    @Operation(summary = "Update order status (ADMIN)")
    public ResponseEntity<ApiResponse<AdminOrderResponse>> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody Map<String, String> body) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        String newStatus = body.get("status");
        if (newStatus != null && !newStatus.isBlank()) {
            order.setStatus(newStatus.toUpperCase());
            orderRepository.save(order);
        }
        return ResponseEntity.ok(ApiResponse.ok(AdminOrderResponse.from(order)));
    }

    // ── Coupons ───────────────────────────────────────────────────────────────

    @GetMapping("/coupons")
    @Operation(summary = "List all coupons (ADMIN)")
    public ResponseEntity<ApiResponse<List<AdminCouponResponse>>> listCoupons() {
        List<AdminCouponResponse> list = couponRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(AdminCouponResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/coupons")
    @Transactional
    @Operation(summary = "Create a new coupon (ADMIN)")
    public ResponseEntity<ApiResponse<AdminCouponResponse>> createCoupon(
            @Valid @RequestBody AdminCreateCouponRequest req) {
        String code = req.code().toUpperCase();
        couponRepository.findByCode(code).ifPresent(c -> {
            throw new IllegalStateException("Coupon code already exists: " + code);
        });

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setType(CouponType.valueOf(req.discountType().toUpperCase()));
        coupon.setValue(req.discountValue());
        if (req.minOrderAmount() != null) coupon.setMinOrderAmount(req.minOrderAmount());
        if (req.maxDiscount() != null)    coupon.setMaxDiscount(req.maxDiscount());
        if (req.maxUses() != null)        coupon.setUsageLimit(req.maxUses());
        if (req.expiresAt() != null && !req.expiresAt().isBlank()) {
            coupon.setExpiresAt(LocalDateTime.parse(req.expiresAt()));
        }
        coupon.setIsActive(true);
        couponRepository.save(coupon);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(AdminCouponResponse.from(coupon), "Coupon created"));
    }

    @PutMapping("/coupons/{couponId}")
    @Transactional
    @Operation(summary = "Update an existing coupon (ADMIN)")
    public ResponseEntity<ApiResponse<AdminCouponResponse>> updateCoupon(
            @PathVariable UUID couponId,
            @Valid @RequestBody AdminCreateCouponRequest req) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", couponId));

        String code = req.code().toUpperCase();
        if (!code.equals(coupon.getCode())) {
            couponRepository.findByCode(code).ifPresent(c -> {
                throw new IllegalStateException("Coupon code already exists: " + code);
            });
            coupon.setCode(code);
        }
        coupon.setType(CouponType.valueOf(req.discountType().toUpperCase()));
        coupon.setValue(req.discountValue());
        if (req.minOrderAmount() != null) coupon.setMinOrderAmount(req.minOrderAmount());
        if (req.maxDiscount() != null)    coupon.setMaxDiscount(req.maxDiscount());
        if (req.maxUses() != null)        coupon.setUsageLimit(req.maxUses());
        if (req.expiresAt() != null && !req.expiresAt().isBlank()) {
            coupon.setExpiresAt(LocalDateTime.parse(req.expiresAt()));
        }
        couponRepository.save(coupon);
        return ResponseEntity.ok(ApiResponse.ok(AdminCouponResponse.from(coupon)));
    }

    @DeleteMapping("/coupons/{couponId}")
    @Transactional
    @Operation(summary = "Soft-delete (deactivate) a coupon (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", couponId));
        coupon.setIsActive(false);
        couponRepository.save(coupon);
        return ResponseEntity.ok(ApiResponse.ok(null, "Coupon deactivated"));
    }

    @GetMapping("/coupons/{couponId}/usages")
    @Operation(summary = "List usages for a coupon (ADMIN)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCouponUsages(@PathVariable UUID couponId) {
        couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", couponId));
        var usages = couponUsageRepository.findByCoupon_IdOrderByUsedAtDesc(couponId)
                .stream().map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("userName",        u.getUser() != null ? u.getUser().getName()  : null);
                    m.put("userEmail",       u.getUser() != null ? u.getUser().getEmail() : null);
                    m.put("orderId",         u.getOrder() != null ? u.getOrder().getId()  : null);
                    m.put("discountApplied", u.getDiscount());
                    m.put("usedAt",          u.getUsedAt());
                    return m;
                }).toList();
        return ResponseEntity.ok(ApiResponse.ok(usages));
    }

    // ── Payments ──────────────────────────────────────────────────────────────

    @GetMapping("/payments")
    @Transactional(readOnly = true)
    @Operation(summary = "List all payments with optional provider/status filter (ADMIN)")
    public ResponseEntity<ApiResponse<Page<AdminPaymentResponse>>> listPayments(
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String p = provider != null ? provider.toUpperCase() : null;
        String s = status   != null ? status.toUpperCase()   : null;
        int sz = Math.min(size, 100);

        List<Payment> all = paymentRepository.findAllAdminEager(p, s);
        int total = all.size();
        int from  = Math.min(page * sz, total);
        int to    = Math.min(from + sz, total);
        List<AdminPaymentResponse> pageContent = all.subList(from, to)
                .stream().map(AdminPaymentResponse::from).toList();
        Page<AdminPaymentResponse> result = new PageImpl<>(pageContent, PageRequest.of(page, sz), total);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Product quick controls ────────────────────────────────────────────────

    @PatchMapping("/products/{id}/toggle-active")
    @Transactional
    @Operation(summary = "Toggle product isActive flag (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleProductActive(@PathVariable UUID id) {
        var product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setIsActive(!Boolean.TRUE.equals(product.getIsActive()));
        productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "isActive", product.getIsActive())));
    }

    @PatchMapping("/products/{id}/toggle-flash-deal")
    @Transactional
    @Operation(summary = "Toggle product isFlashDeal flag (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleFlashDeal(@PathVariable UUID id) {
        var product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setIsFlashDeal(!Boolean.TRUE.equals(product.getIsFlashDeal()));
        productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "isFlashDeal", product.getIsFlashDeal())));
    }

    @PatchMapping("/products/{id}/badge")
    @Transactional
    @Operation(summary = "Set product badge (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setProductBadge(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        var product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        String badge = body.get("badge");
        product.setBadge(badge != null && !badge.isBlank() ? badge.toUpperCase() : null);
        productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "badge", product.getBadge() != null ? product.getBadge() : "")));
    }

    @PostMapping("/products/bulk-toggle-active")
    @Transactional
    @Operation(summary = "Bulk toggle isActive for a list of products (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkToggleActive(
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("productIds");
        Boolean isActive = (Boolean) body.get("isActive");
        if (ids == null || isActive == null) {
            return ResponseEntity.badRequest().body(ApiResponse.ok(null, "productIds and isActive are required"));
        }
        List<UUID> uuids = ids.stream().map(UUID::fromString).toList();
        int updated = 0;
        for (UUID uuid : uuids) {
            var product = productRepository.findById(uuid).orElse(null);
            if (product != null) {
                product.setIsActive(isActive);
                productRepository.save(product);
                updated++;
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("updated", updated, "isActive", isActive)));
    }

    // ── System health / metrics ───────────────────────────────────────────────

    @GetMapping("/system/health")
    @Operation(summary = "Get system health and JVM metrics (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemHealth() {
        Map<String, Object> result = new LinkedHashMap<>();

        RuntimeMXBean runtime = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
        ThreadMXBean threads = ManagementFactory.getThreadMXBean();
        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();

        result.put("status", "UP");
        result.put("uptimeMs", runtime.getUptime());
        result.put("jvmName", runtime.getVmName());
        result.put("javaVersion", System.getProperty("java.version"));

        Map<String, Object> mem = new LinkedHashMap<>();
        mem.put("heapUsedMb", memory.getHeapMemoryUsage().getUsed() / (1024 * 1024));
        mem.put("heapMaxMb", memory.getHeapMemoryUsage().getMax() / (1024 * 1024));
        mem.put("nonHeapUsedMb", memory.getNonHeapMemoryUsage().getUsed() / (1024 * 1024));
        result.put("memory", mem);

        Map<String, Object> threadInfo = new LinkedHashMap<>();
        threadInfo.put("liveThreads", threads.getThreadCount());
        threadInfo.put("daemonThreads", threads.getDaemonThreadCount());
        threadInfo.put("peakThreads", threads.getPeakThreadCount());
        result.put("threads", threadInfo);

        result.put("availableProcessors", os.getAvailableProcessors());
        result.put("systemLoadAverage", os.getSystemLoadAverage());

        // HikariCP pool stats
        try {
            com.zaxxer.hikari.HikariDataSource hikari = (com.zaxxer.hikari.HikariDataSource) dataSource;
            var pool = hikari.getHikariPoolMXBean();
            if (pool != null) {
                Map<String, Object> dbPool = new LinkedHashMap<>();
                dbPool.put("activeConnections", pool.getActiveConnections());
                dbPool.put("idleConnections", pool.getIdleConnections());
                dbPool.put("totalConnections", pool.getTotalConnections());
                dbPool.put("threadsAwaitingConnection", pool.getThreadsAwaitingConnection());
                result.put("dbPool", dbPool);
            }
        } catch (Exception e) {
            result.put("dbPool", "unavailable");
        }

        result.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/system/metrics")
    @Operation(summary = "Get detailed JVM metrics (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemMetrics() {
        Map<String, Object> result = new LinkedHashMap<>();

        RuntimeMXBean runtime = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memory   = ManagementFactory.getMemoryMXBean();
        ThreadMXBean threads  = ManagementFactory.getThreadMXBean();
        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();

        // Memory (bytes)
        result.put("heapUsed",    memory.getHeapMemoryUsage().getUsed());
        result.put("heapMax",     memory.getHeapMemoryUsage().getMax());
        result.put("nonHeapUsed", memory.getNonHeapMemoryUsage().getUsed());
        result.put("totalMemory", Runtime.getRuntime().totalMemory());
        result.put("freeMemory",  Runtime.getRuntime().freeMemory());

        // Threads
        result.put("threadCount",       threads.getThreadCount());
        result.put("daemonThreadCount", threads.getDaemonThreadCount());
        result.put("peakThreadCount",   threads.getPeakThreadCount());

        // GC totals
        long totalGcCount = 0, totalGcTime = 0;
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            if (gc.getCollectionCount() > 0) totalGcCount += gc.getCollectionCount();
            if (gc.getCollectionTime()  > 0) totalGcTime  += gc.getCollectionTime();
        }
        result.put("gcCount",  totalGcCount);
        result.put("gcTimeMs", totalGcTime);

        // CPU (0.0–1.0)
        double cpuLoad = -1.0;
        if (os instanceof com.sun.management.OperatingSystemMXBean sunOs) {
            cpuLoad = sunOs.getProcessCpuLoad();
        }
        result.put("cpuLoad", cpuLoad >= 0 ? cpuLoad : null);
        result.put("availableProcessors", os.getAvailableProcessors());

        // JVM identity
        result.put("vmName",    runtime.getVmName());
        result.put("vmVersion", runtime.getVmVersion());
        result.put("javaHome",  System.getProperty("java.home"));
        result.put("osName",    os.getName());
        result.put("osVersion", os.getVersion());
        result.put("osArch",    os.getArch());

        // Uptime & start
        result.put("uptimeMs",  runtime.getUptime());
        result.put("startTime", runtime.getStartTime());

        // Class loading
        try {
            java.lang.management.ClassLoadingMXBean cl = ManagementFactory.getClassLoadingMXBean();
            result.put("loadedClassCount", cl.getLoadedClassCount());
        } catch (Exception e) { result.put("loadedClassCount", null); }

        // HikariCP pool
        try {
            com.zaxxer.hikari.HikariDataSource hikari = (com.zaxxer.hikari.HikariDataSource) dataSource;
            var pool = hikari.getHikariPoolMXBean();
            if (pool != null) {
                result.put("dbPoolActive", pool.getActiveConnections());
                result.put("dbPoolTotal",  pool.getTotalConnections());
            }
        } catch (Exception e) {
            result.put("dbPoolActive", null);
            result.put("dbPoolTotal",  null);
        }

        result.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/system/db-stats")
    @Operation(summary = "Get DB table row counts and database size (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDbStats() {
        Map<String, Object> result = new LinkedHashMap<>();

        // Database size
        try {
            Object sizeResult = entityManager
                    .createNativeQuery("SELECT pg_size_pretty(pg_database_size(current_database()))").getSingleResult();
            result.put("dbSize", sizeResult != null ? sizeResult.toString() : "unknown");
        } catch (Exception e) { result.put("dbSize", "unknown"); }

        // DB name + version
        try {
            Object dbName = entityManager.createNativeQuery("SELECT current_database()").getSingleResult();
            result.put("dbName", dbName != null ? dbName.toString() : "nexvault");
        } catch (Exception e) { result.put("dbName", "nexvault"); }

        try {
            Object ver = entityManager.createNativeQuery("SELECT version()").getSingleResult();
            String vs = ver != null ? ver.toString() : "";
            // Trim to "PostgreSQL 16.x"
            result.put("pgVersion", vs.contains(" ") ? vs.substring(0, vs.indexOf(" on ")) : vs);
        } catch (Exception e) { result.put("pgVersion", "unknown"); }

        // Connection stats
        try {
            Object active = entityManager.createNativeQuery(
                "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'").getSingleResult();
            Object total = entityManager.createNativeQuery(
                "SELECT count(*) FROM pg_stat_activity").getSingleResult();
            Object maxConn = entityManager.createNativeQuery(
                "SELECT setting FROM pg_settings WHERE name='max_connections'").getSingleResult();
            result.put("activeConnections", active  != null ? ((Number)active).intValue()                  : 0);
            result.put("totalConnections",  total   != null ? ((Number)total).intValue()                   : 0);
            result.put("maxConnections",    maxConn != null ? Integer.parseInt(maxConn.toString())         : 0);
        } catch (Exception e) {
            result.put("activeConnections", 0);
            result.put("totalConnections",  0);
            result.put("maxConnections",    0);
        }

        // Table row counts
        String[] tables = {"users", "products", "categories", "orders", "order_items",
                           "payments", "coupons", "coupon_usages", "cart_items", "wishlists", "reviews"};
        List<Map<String, Object>> tableList = new ArrayList<>();
        for (String table : tables) {
            try {
                Object count = entityManager.createNativeQuery("SELECT COUNT(*) FROM " + table).getSingleResult();
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("tableName", table);
                t.put("rowCount",  ((Number) count).longValue());
                tableList.add(t);
            } catch (Exception ignored) { }
        }
        result.put("tables", tableList);
        result.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    // ── Realtime analytics ────────────────────────────────────────────────────

    @GetMapping("/analytics/realtime")
    @Operation(summary = "Get realtime analytics for last 60 minutes (ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRealtimeAnalytics() {
        LocalDateTime since = LocalDateTime.now().minusHours(1);

        long ordersLast1h = orderRepository.countSince(since);
        Double revRaw = orderRepository.sumRevenueSince(since);
        double revenueLast1h = revRaw != null ? revRaw : 0.0;

        List<AdminOrderResponse> recentOrders = orderRepository
                .findRecentOrders(PageRequest.of(0, 5))
                .stream().map(AdminOrderResponse::from).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ordersLast1h", ordersLast1h);
        result.put("revenueLast1h", revenueLast1h);
        result.put("activeSessions", 0);
        result.put("recentOrders", recentOrders);
        result.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
