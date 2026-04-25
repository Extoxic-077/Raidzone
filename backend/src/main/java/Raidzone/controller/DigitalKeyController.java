package Raidzone.controller;

import Raidzone.dto.response.ApiResponse;
import Raidzone.service.DigitalKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/my-keys")
@RequiredArgsConstructor
@Tag(name = "My Keys", description = "User's purchased digital keys")
public class DigitalKeyController {

    private final DigitalKeyService digitalKeyService;

    @GetMapping
    @Operation(summary = "Get all digital keys purchased by the authenticated user")
    public ResponseEntity<ApiResponse<List<DigitalKeyService.UserKeyView>>> getMyKeys(
            Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(digitalKeyService.getKeysForUser(userId)));
    }
}
