package com.chessvision.chessvisionbackend.dto;

import java.util.List;
import java.util.UUID;

public record DashboardResponse(
        int totalGames,
        Double averageAccuracy,
        Double averageBlunders,
        Integer performanceLower,
        Integer performanceUpper,
        List<Double> accuracyTrend,
        FocusAreaResponse focusArea,
        List<RecentGameResponse> recentGames
) {

    public record FocusAreaResponse(
            String phase,
            String strongestPhase,
            Double averageCentipawnLoss,
            Integer score,
            Integer suggestedBlunderGoal
    ) {
    }

    public record RecentGameResponse(
            UUID gameId,
            String opponent,
            String playedAs,
            String result,
            Double accuracy,
            Integer blunders,
            String createdAt
    ) {
    }
}