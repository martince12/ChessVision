package com.chessvision.chessvisionbackend.dto;

public record ExternalGameImportResponse(
        boolean imported,
        String message,
        String source,
        String pgn
) {
}