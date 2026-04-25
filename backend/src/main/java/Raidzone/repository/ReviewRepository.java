package Raidzone.repository;

import Raidzone.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Query("SELECT r FROM Review r JOIN FETCH r.user WHERE r.product.id = :productId ORDER BY r.createdAt DESC")
    List<Review> findByProductId(@Param("productId") UUID productId);

    Optional<Review> findByProduct_IdAndUser_Id(UUID productId, UUID userId);

    boolean existsByProduct_IdAndUser_Id(UUID productId, UUID userId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.product.id = :productId")
    Double avgRatingByProductId(@Param("productId") UUID productId);

    long countByProduct_Id(UUID productId);
}
