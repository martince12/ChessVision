package com.chessvision.chessvisionbackend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PositionAnalysisRequest(

        @NotBlank(message = "FEN cannot be empty.")
        @Size(max = 120, message = "FEN is too long.")
        String fen,

        @Min(value = 8, message = "Depth must be at least 8.")
        @Max(value = 22, message = "Depth cannot be above 22.")
        Integer depth
) {
}