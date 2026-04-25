package Raidzone.controller;

import Raidzone.dto.request.CouponApplyRequest;
import Raidzone.dto.response.ApiResponse;
import Raidzone.dto.response.CouponApplyResponse;
import Raidzone.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Coupon validation endpoint — PREVIEW ONLY, does not redeem the coupon.
 * Redemption happens inside OrderService when the order is placed.
 */
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Coupon validation and preview")
@SecurityRequirement(name = "bearerAuth")
public class CouponController {

    private final CouponService couponService;

    @PostMapping("/apply")
    @Operation(summary = "Validate and preview a coupon discount (does not redeem)")
    public ResponseEntity<ApiResponse<CouponApplyResponse>> applyCoupon(
            @RequestBody CouponApplyRequest req,
            Authentication auth) {

        UUID userId = (UUID) auth.getPrincipal();
        CouponApplyResponse result = couponService.validateAndPreview(req.code(), req.orderAmount(), userId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
