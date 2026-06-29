package com.chessvision.chessvisionbackend.dto;

import java.util.UUID;

public record SavedGameReviewResponse(
        UUID gameId,
        String pgn,
        FullGameAnalysisResponse fullGameAnalysis
) {
}