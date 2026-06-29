package com.chessvision.chessvisionbackend.dto;

public record PgnValidationResponse(
        boolean valid,
        String message,
        String whitePlayer,
        String blackPlayer,
        String result,
        Integer moveCount,
        Integer halfMoveCount,
        String eventName,
        String site,
        String gameDate,
        String timeControl,
        Integer whiteElo,
        Integer blackElo
) {
}
