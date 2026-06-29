package com.chessvision.chessvisionbackend.dto;

public record PlayerAnalysisSummaryResponse(
        String side,
        Double accuracy,
        Double averageCentipawnLoss,
        Integer movesPlayed,
        Integer bestMoves,
        Integer excellentMoves,
        Integer goodMoves,
        Integer inaccuracies,
        Integer mistakes,
        Integer blunders
) {
}