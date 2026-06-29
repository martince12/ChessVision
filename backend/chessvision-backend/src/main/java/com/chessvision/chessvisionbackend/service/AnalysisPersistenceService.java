package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.FullGameAnalysisRequest;
import com.chessvision.chessvisionbackend.dto.FullGameAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.MoveAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.PlayerAnalysisSummaryResponse;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AnalysisPersistenceService {

    private static final Pattern PGN_TAG_PATTERN = Pattern.compile(
            "^\\s*\\[([A-Za-z0-9_]+)\\s+\"(.*)\"\\]\\s*$"
    );

    private final JdbcTemplate jdbcTemplate;

    public AnalysisPersistenceService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void saveCompletedAnalysis(
            UUID userId,
            FullGameAnalysisRequest request,
            FullGameAnalysisResponse analysis
    ) {
        UUID gameId = UUID.randomUUID();
        UUID analysisId = UUID.randomUUID();

        List<MoveAnalysisResponse> moves = analysis.moves() == null
                ? List.of()
                : analysis.moves();

        PgnMetadata metadata = extractPgnMetadata(
                request.pgn(),
                analysis,
                moves.size()
        );

        saveGame(
                gameId,
                userId,
                request,
                analysis,
                metadata
        );

        saveGameAnalysis(
                analysisId,
                gameId,
                request,
                analysis
        );

        saveMoveAnalyses(
                analysisId,
                moves
        );
    }

    private void saveGame(
            UUID gameId,
            UUID userId,
            FullGameAnalysisRequest request,
            FullGameAnalysisResponse analysis,
            PgnMetadata metadata
    ) {
        String sql = """
                insert into public.games (
                    id,
                    user_id,
                    source,
                    source_url,
                    pgn,
                    white_player,
                    black_player,
                    result,
                    event_name,
                    site,
                    game_date_text,
                    time_control,
                    white_elo,
                    black_elo,
                    move_count,
                    half_move_count,
                    created_at,
                    updated_at
                )
                values (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    current_timestamp,
                    current_timestamp
                )
                """;

        jdbcTemplate.update(
                sql,
                gameId,
                userId,
                normalizeSource(request.source()),
                nullIfBlank(request.sourceUrl()),
                request.pgn().trim(),
                metadata.whitePlayer(),
                metadata.blackPlayer(),
                metadata.result(),
                metadata.eventName(),
                metadata.site(),
                metadata.gameDateText(),
                metadata.timeControl(),
                metadata.whiteElo(),
                metadata.blackElo(),
                metadata.moveCount(),
                metadata.halfMoveCount()
        );
    }

    private void saveGameAnalysis(
            UUID analysisId,
            UUID gameId,
            FullGameAnalysisRequest request,
            FullGameAnalysisResponse analysis
    ) {
        PlayerAnalysisSummaryResponse whiteSummary =
                analysis.whiteSummary();

        PlayerAnalysisSummaryResponse blackSummary =
                analysis.blackSummary();

        String sql = """
                insert into public.game_analyses (
                    id,
                    game_id,
                    mode,
                    status,
                    engine_name,
                    engine_depth,
                    white_accuracy,
                    black_accuracy,
                    white_average_cpl,
                    black_average_cpl,
                    white_best_moves,
                    white_excellent_moves,
                    white_good_moves,
                    white_inaccuracies,
                    white_mistakes,
                    white_blunders,
                    black_best_moves,
                    black_excellent_moves,
                    black_good_moves,
                    black_inaccuracies,
                    black_mistakes,
                    black_blunders,
                    error_message,
                    started_at,
                    completed_at,
                    created_at,
                    updated_at
                )
                values (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    null,
                    current_timestamp,
                    current_timestamp,
                    current_timestamp,
                    current_timestamp
                )
                """;

        jdbcTemplate.update(
                sql,
                analysisId,
                gameId,
                normalizeMode(analysis.mode(), request.mode()),
                "completed",
                analysis.engineName(),
                analysis.depth(),

                whiteSummary == null ? null : whiteSummary.accuracy(),
                blackSummary == null ? null : blackSummary.accuracy(),

                whiteSummary == null
                        ? null
                        : whiteSummary.averageCentipawnLoss(),

                blackSummary == null
                        ? null
                        : blackSummary.averageCentipawnLoss(),

                count(whiteSummary == null
                        ? null
                        : whiteSummary.bestMoves()),

                count(whiteSummary == null
                        ? null
                        : whiteSummary.excellentMoves()),

                count(whiteSummary == null
                        ? null
                        : whiteSummary.goodMoves()),

                count(whiteSummary == null
                        ? null
                        : whiteSummary.inaccuracies()),

                count(whiteSummary == null
                        ? null
                        : whiteSummary.mistakes()),

                count(whiteSummary == null
                        ? null
                        : whiteSummary.blunders()),

                count(blackSummary == null
                        ? null
                        : blackSummary.bestMoves()),

                count(blackSummary == null
                        ? null
                        : blackSummary.excellentMoves()),

                count(blackSummary == null
                        ? null
                        : blackSummary.goodMoves()),

                count(blackSummary == null
                        ? null
                        : blackSummary.inaccuracies()),

                count(blackSummary == null
                        ? null
                        : blackSummary.mistakes()),

                count(blackSummary == null
                        ? null
                        : blackSummary.blunders())
        );
    }

    private void saveMoveAnalyses(
            UUID analysisId,
            List<MoveAnalysisResponse> moves
    ) {
        if (moves.isEmpty()) {
            return;
        }

        String sql = """
                insert into public.move_analyses (
                    id,
                    analysis_id,
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
                    mate_after_white,
                    reason_code,
                    reason_title,
                    reason_text,
                    reason_detail,
                    created_at
                )
                values (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    null, null, null, null,
                    current_timestamp
                )
                """;

        jdbcTemplate.batchUpdate(
                sql,
                new BatchPreparedStatementSetter() {

                    @Override
                    public void setValues(
                            PreparedStatement statement,
                            int index
                    ) throws SQLException {
                        MoveAnalysisResponse move = moves.get(index);

                        statement.setObject(1, UUID.randomUUID());
                        statement.setObject(2, analysisId);

                        statement.setObject(3, move.ply());
                        statement.setObject(4, move.moveNumber());

                        statement.setString(5, move.side());
                        statement.setString(6, move.san());
                        statement.setString(7, move.uci());

                        statement.setString(8, move.fenBefore());
                        statement.setString(9, move.fenAfter());

                        statement.setString(10, move.bestMoveUci());
                        statement.setString(11, move.bestResponseUci());

                        statement.setObject(
                                12,
                                move.evaluationBeforeWhiteCp()
                        );

                        statement.setObject(
                                13,
                                move.evaluationAfterWhiteCp()
                        );

                        statement.setObject(
                                14,
                                move.centipawnLoss()
                        );

                        statement.setString(
                                15,
                                move.classification()
                        );

                        statement.setObject(16, move.depth());

                        statement.setString(
                                17,
                                move.principalVariation()
                        );

                        statement.setString(
                                18,
                                move.responsePrincipalVariation()
                        );

                        statement.setObject(
                                19,
                                move.mateBeforeWhite()
                        );

                        statement.setObject(
                                20,
                                move.mateAfterWhite()
                        );
                    }

                    @Override
                    public int getBatchSize() {
                        return moves.size();
                    }
                }
        );
    }

    private PgnMetadata extractPgnMetadata(
            String pgn,
            FullGameAnalysisResponse analysis,
            int halfMoveCount
    ) {
        Map<String, String> headers = new HashMap<>();

        for (String line : pgn.split("\\R")) {
            Matcher matcher = PGN_TAG_PATTERN.matcher(line);

            if (!matcher.matches()) {
                continue;
            }

            String key = matcher.group(1)
                    .toLowerCase(Locale.ROOT);

            String value = matcher.group(2)
                    .replace("\\\"", "\"")
                    .trim();

            headers.put(key, value);
        }

        Integer moveCount = analysis.moveCount() != null
                ? analysis.moveCount()
                : (halfMoveCount + 1) / 2;

        return new PgnMetadata(
                firstNonBlank(
                        analysis.whitePlayer(),
                        headers.get("white")
                ),
                firstNonBlank(
                        analysis.blackPlayer(),
                        headers.get("black")
                ),
                firstNonBlank(
                        headers.get("result"),
                        "*"
                ),
                nullIfBlank(headers.get("event")),
                nullIfBlank(headers.get("site")),
                nullIfBlank(headers.get("date")),
                nullIfBlank(headers.get("timecontrol")),
                parseInteger(headers.get("whiteelo")),
                parseInteger(headers.get("blackelo")),
                moveCount,
                halfMoveCount
        );
    }

    private String normalizeSource(String source) {
        if (source == null || source.isBlank()) {
            return "pasted_pgn";
        }

        return switch (source.trim().toLowerCase(Locale.ROOT)) {
            case "pasted_pgn" -> "pasted_pgn";
            case "pgn_file" -> "pgn_file";
            case "lichess" -> "lichess";
            case "chesscom" -> "chesscom";
            case "manual" -> "manual";
            default -> "pasted_pgn";
        };
    }

    private String normalizeMode(
            String analysisMode,
            String requestMode
    ) {
        String mode = firstNonBlank(
                analysisMode,
                requestMode,
                "standard"
        );

        return mode.toLowerCase(Locale.ROOT);
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private int count(Integer value) {
        return value == null ? 0 : value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        return null;
    }

    private String nullIfBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private record PgnMetadata(
            String whitePlayer,
            String blackPlayer,
            String result,
            String eventName,
            String site,
            String gameDateText,
            String timeControl,
            Integer whiteElo,
            Integer blackElo,
            Integer moveCount,
            Integer halfMoveCount
    ) {
    }
}