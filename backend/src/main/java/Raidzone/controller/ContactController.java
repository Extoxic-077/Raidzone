package Raidzone.controller;

import Raidzone.dto.request.ContactRequest;
import Raidzone.dto.request.PartnershipRequest;
import Raidzone.dto.response.ApiResponse;
import Raidzone.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Contact and partnership form submissions")
public class ContactController {

    private final EmailService emailService;

    @PostMapping("/contact")
    @Operation(summary = "Submit contact form — sends email to admin")
    public ResponseEntity<ApiResponse<Void>> contact(@Valid @RequestBody ContactRequest req) {
        emailService.sendContactFormEmail(req.name(), req.email(), req.topic(), req.message());
        return ResponseEntity.ok(ApiResponse.ok(null, "Message received. We'll reply shortly."));
    }

    @PostMapping("/partnerships")
    @Operation(summary = "Submit partnership enquiry — sends email to admin")
    public ResponseEntity<ApiResponse<Void>> partnership(@Valid @RequestBody PartnershipRequest req) {
        emailService.sendPartnershipFormEmail(req.name(), req.email(), req.type(), req.message());
        return ResponseEntity.ok(ApiResponse.ok(null, "Enquiry received. We'll be in touch within 2 business days."));
    }
}
