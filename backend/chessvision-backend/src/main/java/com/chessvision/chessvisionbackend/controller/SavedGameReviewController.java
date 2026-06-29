package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.dto.SavedGameReviewResponse;
import com.chessvision.chessvisionbackend.service.SavedGameReviewService;
import com.chessvision.chessvisionbackend.service.SupabaseAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/games")
public class SavedGameReviewController {

    private final SavedGameReviewService savedGameReviewService;
    private final SupabaseAuthService supabaseAuthService;

    public SavedGameReviewController(
            SavedGameReviewService savedGameReviewService,
            SupabaseAuthService supabaseAuthService
    ) {
        this.savedGameReviewService = savedGameReviewService;
        this.supabaseAuthService = supabaseAuthService;
    }

    @GetMapping("/{gameId}/review")
    public SavedGameReviewResponse getSavedReview(
            @PathVariable UUID gameId,
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorizationHeader
    ) {
        AuthenticatedUser user =
                supabaseAuthService.requireAuthenticatedUser(
                        authorizationHeader
                );

        return savedGameReviewService.loadSavedReview(
                user.id(),
                gameId
        );
    }
}