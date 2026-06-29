package com.chessvision.chessvisionbackend.dto;

public record EngineAnalysisResponse(
        boolean available,
        String message,
        String engineName,
        String bestMove,
        String scoreType,
        Integer scoreValue,
        Integer depth,
        String principalVariation
) {
}