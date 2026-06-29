package com.chessvision.chessvisionbackend.dto;

import java.util.UUID;

public record AuthenticatedUser(
        UUID id,
        String email,
        String displayName
) {
}