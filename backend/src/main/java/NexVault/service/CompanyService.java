package NexVault.service;

import NexVault.dto.response.CompanyResponse;
import NexVault.exception.ResourceNotFoundException;
import NexVault.model.Company;
import NexVault.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;

    public List<CompanyResponse> getActiveCompanies() {
        return companyRepository.findByIsActiveTrueOrderBySortOrderAscNameAsc()
                .stream().map(CompanyResponse::from).toList();
    }

    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll(
                org.springframework.data.domain.Sort.by("sortOrder").ascending()
                        .and(org.springframework.data.domain.Sort.by("name").ascending()))
                .stream().map(CompanyResponse::from).toList();
    }

    @Transactional
    public CompanyResponse create(String name, String slug, String description, String logoUrl, String websiteUrl, Integer sortOrder) {
        Company c = new Company();
        c.setName(name);
        c.setSlug(slug);
        c.setDescription(description);
        c.setLogoUrl(logoUrl);
        c.setWebsiteUrl(websiteUrl);
        c.setSortOrder(sortOrder != null ? sortOrder : 0);
        c.setIsActive(true);
        c = companyRepository.save(c);
        log.info("Created company {} ({})", c.getName(), c.getId());
        return CompanyResponse.from(c);
    }

    @Transactional
    public CompanyResponse update(UUID id, String name, String slug, String description,
                                  String logoUrl, String websiteUrl, Integer sortOrder, Boolean isActive) {
        Company c = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));
        if (name != null)       c.setName(name);
        if (slug != null)       c.setSlug(slug);
        if (description != null) c.setDescription(description);
        if (logoUrl != null)    c.setLogoUrl(logoUrl);
        if (websiteUrl != null) c.setWebsiteUrl(websiteUrl);
        if (sortOrder != null)  c.setSortOrder(sortOrder);
        if (isActive != null)   c.setIsActive(isActive);
        return CompanyResponse.from(companyRepository.save(c));
    }

    @Transactional
    public void deactivate(UUID id) {
        Company c = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));
        c.setIsActive(false);
        companyRepository.save(c);
    }
}
