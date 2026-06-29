package com.chessvision.chessvisionbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAccountProfileRequest(

        @NotBlank(message = "Username cannot be empty.")
        @Size(
                min = 3,
                max = 30,
                message = "Username must be between 3 and 30 characters."
        )
        @Pattern(
                regexp = "^[A-Za-z0-9_]+$",
                message = "Username may contain only letters, numbers, and underscores."
        )
        String username,

        @NotBlank(message = "Display name cannot be empty.")
        @Size(
                min = 2,
                max = 50,
                message = "Display name must be between 2 and 50 characters."
        )
        String displayName
) {
}