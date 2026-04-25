package Raidzone.dto.response;

import Raidzone.model.Company;

import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String slug,
        String logoUrl,
        String description,
        String websiteUrl,
        Boolean isActive,
        Integer sortOrder
) {
    public static CompanyResponse from(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getSlug(),
                company.getLogoUrl(),
                company.getDescription(),
                company.getWebsiteUrl(),
                company.getIsActive(),
                company.getSortOrder()
        );
    }
}
