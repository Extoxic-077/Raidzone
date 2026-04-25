package Raidzone.repository;

import Raidzone.model.EmailSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailSubscriberRepository extends JpaRepository<EmailSubscriber, UUID> {

    Optional<EmailSubscriber> findByEmail(String email);

    @Query("SELECT s.email FROM EmailSubscriber s WHERE s.subscribed = true")
    List<String> findAllActiveEmails();

    long countBySubscribedTrue();
}
