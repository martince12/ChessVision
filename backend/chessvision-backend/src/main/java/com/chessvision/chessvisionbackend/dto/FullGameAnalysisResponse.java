package com.chessvision.chessvisionbackend.dto;

import java.util.List;

public record FullGameAnalysisResponse(
        boolean available,
        String message,
        String mode,
        Integer depth,
        String engineName,
        String whitePlayer,
        String blackPlayer,
        Integer moveCount,
        PlayerAnalysisSummaryResponse whiteSummary,
        PlayerAnalysisSummaryResponse blackSummary,
        List<MoveAnalysisResponse> moves
) {
}