package NexVault.repository;

import NexVault.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    /** All orders for a user, newest first, with items eagerly loaded. */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUserIdWithItems(@Param("userId") UUID userId);

    /** Paginated list for admin with optional status and search filters. */
    @Query(value = "SELECT * FROM orders WHERE " +
           "(CAST(:status AS varchar) IS NULL OR status = :status) AND " +
           "(CAST(:search AS varchar) IS NULL OR " +
           " LOWER(shipping_name) LIKE LOWER(('%' || :search || '%')) OR " +
           " LOWER(shipping_email) LIKE LOWER(('%' || :search || '%'))" +
           ") ORDER BY created_at DESC",
           countQuery = "SELECT COUNT(*) FROM orders WHERE " +
           "(CAST(:status AS varchar) IS NULL OR status = :status) AND " +
           "(CAST(:search AS varchar) IS NULL OR " +
           " LOWER(shipping_name) LIKE LOWER(('%' || :search || '%')) OR " +
           " LOWER(shipping_email) LIKE LOWER(('%' || :search || '%')))",
           nativeQuery = true)
    Page<Order> findAllAdmin(
        @Param("status") String status,
        @Param("search") String search,
        Pageable pageable);

    /** Count by status. */
    long countByStatus(String status);

    /** Fetch a single order with its items and products eager-loaded. */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") UUID id);

    /** Revenue from CONFIRMED orders in date range. */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'CONFIRMED' AND o.createdAt BETWEEN :from AND :to")
    Double sumConfirmedRevenueByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Count total orders in date range. */
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    /** Count paid (CONFIRMED) orders in date range. */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'CONFIRMED' AND o.createdAt BETWEEN :from AND :to")
    long countConfirmedByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Revenue grouped by payment method for CONFIRMED orders in date range. */
    @Query("SELECT o.paymentMethod, SUM(o.totalAmount) FROM Order o WHERE o.status = 'CONFIRMED' AND o.createdAt BETWEEN :from AND :to GROUP BY o.paymentMethod")
    List<Object[]> findRevenueByProviderInRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Orders grouped by status in date range. */
    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to GROUP BY o.status")
    List<Object[]> findOrdersByStatusInRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Most recent N orders. */
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);

    /** Returns true if the user has a CONFIRMED order containing the given product. */
    @Query("""
        SELECT COUNT(oi) > 0 FROM OrderItem oi
        JOIN oi.order o
        WHERE o.user.id = :userId
          AND o.status = 'CONFIRMED'
          AND oi.product.id = :productId
        """)
    boolean existsConfirmedOrderWithProduct(
            @Param("userId") UUID userId,
            @Param("productId") UUID productId);

    /** Count orders created since a given timestamp. */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    /** Revenue from CONFIRMED orders since a given timestamp. */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'CONFIRMED' AND o.createdAt >= :since")
    Double sumRevenueSince(@Param("since") LocalDateTime since);

    List<Order> findTop10ByStatusInOrderByCreatedAtDesc(List<String> statuses);
}
