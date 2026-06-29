package com.chessvision.chessvisionbackend.dto;

public record MoveAnalysisResponse(
        Integer ply,
        Integer moveNumber,
        String side,
        String san,
        String uci,
        String fenBefore,
        String fenAfter,
        String bestMoveUci,
        String bestResponseUci,
        Integer evaluationBeforeWhiteCp,
        Integer evaluationAfterWhiteCp,
        Integer centipawnLoss,
        String classification,
        Integer depth,
        String principalVariation,
        String responsePrincipalVariation,

        Integer mateBeforeWhite,
        Integer mateAfterWhite
) {
}