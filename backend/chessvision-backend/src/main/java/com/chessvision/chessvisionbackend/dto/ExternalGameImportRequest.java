package com.chessvision.chessvisionbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExternalGameImportRequest(

        @NotBlank(message = "Game link cannot be empty.")
        @Size(max = 2_000, message = "Game link is too long.")
        String gameUrl
) {
}