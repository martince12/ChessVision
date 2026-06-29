package com.chessvision.chessvisionbackend.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PgnValidationRequest(

        @NotBlank(message = "PGN cannot be empty.")
        @Size(max = 100_000, message = "PGN is too large.")
        String pgn
) {
}
