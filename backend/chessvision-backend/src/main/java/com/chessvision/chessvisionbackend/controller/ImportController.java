package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.ExternalGameImportRequest;
import com.chessvision.chessvisionbackend.dto.ExternalGameImportResponse;
import com.chessvision.chessvisionbackend.service.ExternalGameImportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final ExternalGameImportService externalGameImportService;

    public ImportController(
            ExternalGameImportService externalGameImportService
    ) {
        this.externalGameImportService =
                externalGameImportService;
    }

    @PostMapping("/lichess")
    public ResponseEntity<ExternalGameImportResponse> importLichess(
            @Valid @RequestBody ExternalGameImportRequest request
    ) {
        ExternalGameImportResponse response =
                externalGameImportService.importLichessGame(
                        request.gameUrl()
                );

        if (!response.imported()) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/chesscom")
    public ResponseEntity<ExternalGameImportResponse> importChessCom(
            @Valid @RequestBody ExternalGameImportRequest request
    ) {
        ExternalGameImportResponse response =
                externalGameImportService.importChessComGame(
                        request.gameUrl()
                );

        if (!response.imported()) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }
}