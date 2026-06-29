package com.chessvision.chessvisionbackend.dto;

public record EngineStatusResponse(
        boolean available,
        String message,
        String engineName,
        String enginePath
) {
}