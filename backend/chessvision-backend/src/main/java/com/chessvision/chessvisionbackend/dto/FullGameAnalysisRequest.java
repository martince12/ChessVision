package com.chessvision.chessvisionbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FullGameAnalysisRequest(

        @NotBlank(message = "PGN cannot be empty.")
        @Size(max = 100_000, message = "PGN is too large.")
        String pgn,

        @Pattern(
                regexp = "quick|standard|deep",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Mode must be quick, standard, or deep."
        )
        String mode,

        @Pattern(
                regexp = "pasted_pgn|pgn_file|lichess|chesscom|manual",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Invalid game source."
        )
        String source,

        @Size(max = 2_000, message = "Source URL is too long.")
        String sourceUrl
) {
}