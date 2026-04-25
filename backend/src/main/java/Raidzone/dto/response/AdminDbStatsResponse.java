package Raidzone.dto.response;

import java.util.Map;

public record AdminDbStatsResponse(
    Map<String, Long> tableCounts,
    long databaseSizeBytes,
    String databaseSizeFormatted,
    double longestQueryMs,
    String timestamp
) {}
