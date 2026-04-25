package Raidzone.dto.request;

import java.math.BigDecimal;

public record CouponApplyRequest(String code, BigDecimal orderAmount) {}
