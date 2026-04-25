package Raidzone.repository;

import Raidzone.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Wishlist} entities.
 */
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    @Query("SELECT w FROM Wishlist w JOIN FETCH w.product p WHERE w.user.id = :userId ORDER BY w.createdAt DESC")
    List<Wishlist> findByUserIdWithProduct(@Param("userId") UUID userId);

    Optional<Wishlist> findByUser_IdAndProduct_Id(UUID userId, UUID productId);

    boolean existsByUser_IdAndProduct_Id(UUID userId, UUID productId);

    void deleteByUser_IdAndProduct_Id(UUID userId, UUID productId);

    long countByUser_Id(UUID userId);
}
