package Raidzone.repository;

import Raidzone.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {

    boolean existsByUser_IdAndProduct_Id(UUID userId, UUID productId);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query(value =
        "SELECT pu.product_id, p.name, c.name as category_name, " +
        "COUNT(pu.id) as sales_count, SUM(p.price) as revenue " +
        "FROM purchases pu " +
        "JOIN products p ON pu.product_id = p.id " +
        "LEFT JOIN categories c ON p.category_id = c.id " +
        "WHERE pu.created_at BETWEEN :from AND :to " +
        "GROUP BY pu.product_id, p.name, c.name " +
        "ORDER BY sales_count DESC " +
        "LIMIT 20",
        nativeQuery = true)
    List<Object[]> findTopProductsByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value =
        "SELECT DATE(pu.created_at) as sale_date, COUNT(pu.id) as cnt, SUM(p.price) as revenue " +
        "FROM purchases pu " +
        "JOIN products p ON pu.product_id = p.id " +
        "WHERE pu.created_at BETWEEN :from AND :to " +
        "GROUP BY DATE(pu.created_at) " +
        "ORDER BY DATE(pu.created_at)",
        nativeQuery = true)
    List<Object[]> findDailySalesByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value =
        "SELECT COALESCE(SUM(p.price), 0) " +
        "FROM purchases pu " +
        "JOIN products p ON pu.product_id = p.id " +
        "WHERE pu.created_at BETWEEN :from AND :to",
        nativeQuery = true)
    Double sumRevenueByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
