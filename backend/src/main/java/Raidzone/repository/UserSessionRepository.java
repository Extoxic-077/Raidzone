package Raidzone.repository;

import Raidzone.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    Optional<UserSession> findByUserIdAndIpAddressAndUserAgent(UUID userId, String ipAddress, String userAgent);

    List<UserSession> findByUserIdOrderByLastSeenAtDesc(UUID userId);
}
