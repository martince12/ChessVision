package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.EngineAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.EngineStatusResponse;
import com.chessvision.chessvisionbackend.dto.PositionAnalysisRequest;
import com.chessvision.chessvisionbackend.service.StockfishService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/engine")
public class EngineController {

    private final StockfishService stockfishService;

    public EngineController(StockfishService stockfishService) {
        this.stockfishService = stockfishService;
    }

    @GetMapping("/status")
    public ResponseEntity<EngineStatusResponse> engineStatus() {
        EngineStatusResponse response =
                stockfishService.checkEngineStatus();

        if (!response.available()) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(response);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-analysis")
    public ResponseEntity<EngineAnalysisResponse> testAnalysis() {
        EngineAnalysisResponse response =
                stockfishService.runTestAnalysis();

        if (!response.available()) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(response);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/analyze-position")
    public ResponseEntity<EngineAnalysisResponse> analyzePosition(
            @Valid @RequestBody PositionAnalysisRequest request
    ) {
        EngineAnalysisResponse response =
                stockfishService.analyzePosition(
                        request.fen(),
                        request.depth()
                );

        if (!response.available()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }

        return ResponseEntity.ok(response);
    }
}