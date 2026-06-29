package com.chessvision.chessvisionbackend.dto;

import java.util.UUID;

public record AccountProfileResponse(
        UUID id,
        String email,
        String username,
        String displayName
) {
}