package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.dto.GameHistoryResponse;
import com.chessvision.chessvisionbackend.service.GameHistoryService;
import com.chessvision.chessvisionbackend.service.SupabaseAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/games")
public class GameHistoryController {

    private final GameHistoryService gameHistoryService;
    private final SupabaseAuthService supabaseAuthService;

    public GameHistoryController(
            GameHistoryService gameHistoryService,
            SupabaseAuthService supabaseAuthService
    ) {
        this.gameHistoryService = gameHistoryService;
        this.supabaseAuthService = supabaseAuthService;
    }

    @GetMapping
    public GameHistoryResponse getGameHistory(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorizationHeader,

            @RequestParam(required = false) Integer page,

            @RequestParam(required = false) Integer pageSize,

            @RequestParam(required = false) String source,

            @RequestParam(required = false) String mode,

            @RequestParam(required = false) String search
    ) {
        AuthenticatedUser user =
                supabaseAuthService.requireAuthenticatedUser(
                        authorizationHeader
                );

        return gameHistoryService.getGames(
                user.id(),
                page,
                pageSize,
                source,
                mode,
                search
        );
    }
}