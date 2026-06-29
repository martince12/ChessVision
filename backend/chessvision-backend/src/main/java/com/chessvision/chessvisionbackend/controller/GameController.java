package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.PgnValidationRequest;
import com.chessvision.chessvisionbackend.dto.PgnValidationResponse;
import com.chessvision.chessvisionbackend.service.PgnValidationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final PgnValidationService pgnValidationService;

    public GameController(PgnValidationService pgnValidationService) {
        this.pgnValidationService = pgnValidationService;
    }

    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of(
                "status", "ok",
                "message", "GameController is working"
        );
    }

    @PostMapping("/validate-pgn")
    public ResponseEntity<PgnValidationResponse> validatePgn(
            @Valid @RequestBody PgnValidationRequest request
    ) {
        PgnValidationResponse response =
                pgnValidationService.validatePgn(request.pgn());

        if (!response.valid()) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }
}