package NexVault.controller;

import NexVault.dto.request.SubscribeRequest;
import NexVault.dto.response.ApiResponse;
import NexVault.service.EmailCampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/subscribe")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Email newsletter subscribe/unsubscribe")
public class SubscriptionController {

    private final EmailCampaignService campaignService;

    @PostMapping
    @Operation(summary = "Subscribe an email to the newsletter")
    public ResponseEntity<ApiResponse<Void>> subscribe(@Valid @RequestBody SubscribeRequest req) {
        campaignService.subscribe(req.email());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping
    @Operation(summary = "Unsubscribe an email from the newsletter")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(@Valid @RequestBody SubscribeRequest req) {
        campaignService.unsubscribe(req.email());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
