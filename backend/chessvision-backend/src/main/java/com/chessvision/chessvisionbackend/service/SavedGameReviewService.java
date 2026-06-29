package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.FullGameAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.MoveAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.PlayerAnalysisSummaryResponse;
import com.chessvision.chessvisionbackend.dto.SavedGameReviewResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SavedGameReviewService {

    private final JdbcTemplate jdbcTemplate;

    public SavedGameReviewService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public SavedGameReviewResponse loadSavedReview(
            UUID userId,
            UUID gameId
    ) {
        String gameSql = """
                select
                    g.id as game_id,
                    g.pgn,
                    g.white_player,
                    g.black_player,
                    g.move_count,

                    ga.id as analysis_id,
                    ga.mode,
                    ga.engine_name,
                    ga.engine_depth,

                    ga.white_accuracy,
                    ga.black_accuracy,
                    ga.white_average_cpl,
                    ga.black_average_cpl,

                    ga.white_best_moves,
                    ga.white_excellent_moves,
                    ga.white_good_moves,
                    ga.white_inaccuracies,
                    ga.white_mistakes,
                    ga.white_blunders,

                    ga.black_best_moves,
                    ga.black_excellent_moves,
                    ga.black_good_moves,
                    ga.black_inaccuracies,
                    ga.black_mistakes,
                    ga.black_blunders

                from public.games g
                join public.game_analyses ga
                    on ga.game_id = g.id

                where g.id = ?
                  and g.user_id = ?
                  and ga.status = 'completed'

                order by
                    ga.completed_at desc nulls last,
                    ga.created_at desc

                limit 1
                """;

        List<Map<String, Object>> gameRows =
                jdbcTemplate.queryForList(gameSql, gameId, userId);

        if (gameRows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Saved game not found."
            );
        }

        Map<String, Object> gameRow = gameRows.get(0);

        UUID analysisId = toUuid(gameRow.get("analysis_id"));

        List<MoveAnalysisResponse> moves = loadMoves(analysisId);

        int whiteMovesPlayed = countMovesForSide(moves, "white");
        int blackMovesPlayed = countMovesForSide(moves, "black");

        Integer storedMoveCount = toInteger(gameRow.get("move_count"));

        Integer moveCount = storedMoveCount != null
                ? storedMoveCount
                : Math.max(whiteMovesPlayed, blackMovesPlayed);

        PlayerAnalysisSummaryResponse whiteSummary =
                new PlayerAnalysisSummaryResponse(
                        "white",
                        toDouble(gameRow.get("white_accuracy")),
                        toDouble(gameRow.get("white_average_cpl")),
                        whiteMovesPlayed,
                        zeroIfNull(gameRow.get("white_best_moves")),
                        zeroIfNull(gameRow.get("white_excellent_moves")),
                        zeroIfNull(gameRow.get("white_good_moves")),
                        zeroIfNull(gameRow.get("white_inaccuracies")),
                        zeroIfNull(gameRow.get("white_mistakes")),
                        zeroIfNull(gameRow.get("white_blunders"))
                );

        PlayerAnalysisSummaryResponse blackSummary =
                new PlayerAnalysisSummaryResponse(
                        "black",
                        toDouble(gameRow.get("black_accuracy")),
                        toDouble(gameRow.get("black_average_cpl")),
                        blackMovesPlayed,
                        zeroIfNull(gameRow.get("black_best_moves")),
                        zeroIfNull(gameRow.get("black_excellent_moves")),
                        zeroIfNull(gameRow.get("black_good_moves")),
                        zeroIfNull(gameRow.get("black_inaccuracies")),
                        zeroIfNull(gameRow.get("black_mistakes")),
                        zeroIfNull(gameRow.get("black_blunders"))
                );

        FullGameAnalysisResponse fullGameAnalysis =
                new FullGameAnalysisResponse(
                        true,
                        "Saved analysis loaded.",
                        stringValue(gameRow.get("mode")),
                        toInteger(gameRow.get("engine_depth")),
                        stringValue(gameRow.get("engine_name")),
                        stringValue(gameRow.get("white_player")),
                        stringValue(gameRow.get("black_player")),
                        moveCount,
                        whiteSummary,
                        blackSummary,
                        moves
                );

        return new SavedGameReviewResponse(
                toUuid(gameRow.get("game_id")),
                stringValue(gameRow.get("pgn")),
                fullGameAnalysis
        );
    }

    private List<MoveAnalysisResponse> loadMoves(UUID analysisId) {
        String movesSql = """
                select
                    ply,
                    move_number,
                    side,
                    san,
                    uci,
                    fen_before,
                    fen_after,
                    best_move_uci,
                    best_response_uci,
                    evaluation_before_white_cp,
                    evaluation_after_white_cp,
                    centipawn_loss,
                    classification,
                    depth,
                    principal_variation,
                    response_principal_variation,
                    mate_before_white,
                    mate_after_white

                from public.move_analyses
                where analysis_id = ?
                order by ply asc
                """;

        return jdbcTemplate.query(
                movesSql,
                (resultSet, rowNumber) -> mapMove(resultSet),
                analysisId
        );
    }

    private MoveAnalysisResponse mapMove(
            ResultSet resultSet
    ) throws SQLException {
        return new MoveAnalysisResponse(
                nullableInteger(resultSet, "ply"),
                nullableInteger(resultSet, "move_number"),
                resultSet.getString("side"),
                resultSet.getString("san"),
                resultSet.getString("uci"),
                resultSet.getString("fen_before"),
                resultSet.getString("fen_after"),
                resultSet.getString("best_move_uci"),
                resultSet.getString("best_response_uci"),
                nullableInteger(
                        resultSet,
                        "evaluation_before_white_cp"
                ),
                nullableInteger(
                        resultSet,
                        "evaluation_after_white_cp"
                ),
                nullableInteger(resultSet, "centipawn_loss"),
                resultSet.getString("classification"),
                nullableInteger(resultSet, "depth"),
                resultSet.getString("principal_variation"),
                resultSet.getString(
                        "response_principal_variation"
                ),
                nullableInteger(resultSet, "mate_before_white"),
                nullableInteger(resultSet, "mate_after_white")
        );
    }

    private Integer nullableInteger(
            ResultSet resultSet,
            String columnName
    ) throws SQLException {
        Object value = resultSet.getObject(columnName);

        if (value instanceof Number number) {
            return number.intValue();
        }

        return null;
    }

    private int countMovesForSide(
            List<MoveAnalysisResponse> moves,
            String side
    ) {
        int count = 0;

        for (MoveAnalysisResponse move : moves) {
            if (
                    move.side() != null
                            && move.side().equalsIgnoreCase(side)
            ) {
                count++;
            }
        }

        return count;
    }

    private Integer zeroIfNull(Object value) {
        Integer number = toInteger(value);

        return number == null ? 0 : number;
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        return null;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }

        return null;
    }

    private UUID toUuid(Object value) {
        if (value instanceof UUID uuid) {
            return uuid;
        }

        return UUID.fromString(String.valueOf(value));
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}