package com.chessvision.chessvisionbackend.dto;

import java.util.List;
import java.util.UUID;

public record GameHistoryResponse(
        List<GameHistoryItemResponse> games,
        int page,
        int pageSize,
        long totalGames,
        int totalPages
) {

    public record GameHistoryItemResponse(
            UUID gameId,
            String whitePlayer,
            String blackPlayer,
            String result,
            String source,
            String sourceUrl,
            String mode,
            Double accuracy,
            Integer blunders,
            Integer mistakes,
            Integer moveCount,
            String eventName,
            String createdAt
    ) {
    }
}