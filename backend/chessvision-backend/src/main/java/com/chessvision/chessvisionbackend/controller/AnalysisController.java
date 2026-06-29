package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.FullGameAnalysisRequest;
import com.chessvision.chessvisionbackend.dto.FullGameAnalysisResponse;
import com.chessvision.chessvisionbackend.service.StockfishService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final StockfishService stockfishService;

    public AnalysisController(StockfishService stockfishService) {
        this.stockfishService = stockfishService;
    }

    @PostMapping("/full-game")
    public ResponseEntity<FullGameAnalysisResponse> analyzeFullGame(
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