package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.dto.FullGameAnalysisRequest;
import com.chessvision.chessvisionbackend.dto.FullGameAnalysisResponse;
import com.chessvision.chessvisionbackend.service.AnalysisPersistenceService;
import com.chessvision.chessvisionbackend.service.StockfishService;
import com.chessvision.chessvisionbackend.service.SupabaseAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final StockfishService stockfishService;
    private final SupabaseAuthService supabaseAuthService;
    private final AnalysisPersistenceService analysisPersistenceService;

    public AnalysisController(
            StockfishService stockfishService,
            SupabaseAuthService supabaseAuthService,
            AnalysisPersistenceService analysisPersistenceService
    ) {
        this.stockfishService = stockfishService;
        this.supabaseAuthService = supabaseAuthService;
        this.analysisPersistenceService = analysisPersistenceService;
    }

    /*
     * Logged-in user:
     * Analyze the game and save it in the database.
     */
    @PostMapping("/full-game")
    public ResponseEntity<FullGameAnalysisResponse> analyzeFullGame(
            @Valid @RequestBody FullGameAnalysisRequest request,
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorizationHeader
    ) {
        AuthenticatedUser authenticatedUser =
                supabaseAuthService.requireAuthenticatedUser(
                        authorizationHeader
                );

        FullGameAnalysisResponse response =
                stockfishService.analyzeFullGame(
                        request.pgn(),
                        request.mode()
                );

        if (!response.available()) {
            return ResponseEntity.badRequest().body(response);
        }

        analysisPersistenceService.saveCompletedAnalysis(
                authenticatedUser.id(),
                request,
                response
        );

        return ResponseEntity.ok(response);
    }

    /*
     * Guest user:
     * Analyze normally, but never save the game or its move analysis.
     */
    @PostMapping("/full-game/guest")
    public ResponseEntity<FullGameAnalysisResponse> analyzeGuestFullGame(
            @Valid @RequestBody FullGameAnalysisRequest request
    ) {
        FullGameAnalysisResponse response =
                stockfishService.analyzeFullGame(
                        request.pgn(),
                        request.mode()
                );

        if (!response.available()) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }
}