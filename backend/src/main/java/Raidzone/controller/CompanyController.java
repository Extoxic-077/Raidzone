package Raidzone.controller;

import Raidzone.dto.response.ApiResponse;
import Raidzone.dto.response.CompanyResponse;
import Raidzone.service.CompanyService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Companies", description = "Product brands/companies")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getCompanies() {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getActiveCompanies()));
    }
}
