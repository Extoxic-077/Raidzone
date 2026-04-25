package Raidzone.repository;

import Raidzone.model.OtpCode;
import Raidzone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface OtpRepository extends JpaRepository<OtpCode, UUID> {

    Optional<OtpCode> findTopByUserAndPurposeOrderByCreatedAtDesc(User user, String purpose);

    Optional<OtpCode> findByUserAndCodeAndPurposeAndUsedFalseAndExpiresAtAfter(
            User user, String code, String purpose, LocalDateTime now);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.user = :user AND o.purpose = :purpose")
    void deleteByUserAndPurpose(@Param("user") User user, @Param("purpose") String purpose);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);
}
