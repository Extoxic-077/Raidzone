package Raidzone.repository;

import Raidzone.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {

    List<Company> findByIsActiveTrueOrderBySortOrderAscNameAsc();

    Optional<Company> findBySlug(String slug);
}
