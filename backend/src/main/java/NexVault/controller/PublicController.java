package NexVault.controller;

import NexVault.dto.response.ApiResponse;
import NexVault.service.OrderService;
import NexVault.service.OrderService.PublicOrderActivity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller for general public endpoints that do not fit into other specific domains.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Publicly accessible endpoints")
public class PublicController {

    private final OrderService orderService;

    @GetMapping("/activity")
    @Operation(summary = "Get recent public activity (masked) for social proof")
    public ResponseEntity<ApiResponse<List<PublicOrderActivity>>> getRecentActivity() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getRecentPublicOrders()));
    }
}
