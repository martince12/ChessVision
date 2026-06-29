package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.EngineAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.EngineStatusResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.chessvision.chessvisionbackend.dto.PositionAnalysisRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestBody;
import com.chessvision.chessvisionbackend.dto.FullGameAnalysisResponse;
import com.chessvision.chessvisionbackend.dto.MoveAnalysisResponse;
import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.Side;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.move.MoveList;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import com.chessvision.chessvisionbackend.dto.PlayerAnalysisSummaryResponse;

@Service
public class StockfishService {

    private static final Duration ENGINE_TIMEOUT = Duration.ofSeconds(10);

    private static final Pattern ENGINE_NAME_PATTERN =
            Pattern.compile("^id name (.+)$");

    private static final Pattern DEPTH_PATTERN =
            Pattern.compile("\\bdepth (\\d+)");

    private static final Pattern SCORE_PATTERN =
            Pattern.compile("\\bscore (cp|mate) (-?\\d+)");

    private static final Pattern PRINCIPAL_VARIATION_PATTERN =
            Pattern.compile("\\bpv (.+)$");

    private static final Pattern PGN_HEADER_PATTERN =
            Pattern.compile("^\\s*\\[([A-Za-z0-9_]+)\\s+\"([^\"]*)\"\\]\\s*$");

    private static final Pattern BRACE_COMMENT_PATTERN =
            Pattern.compile("\\{[^}]*}");

    private static final Pattern LINE_COMMENT_PATTERN =
            Pattern.compile("(?m);.*$");

    private static final Pattern NAG_PATTERN =
            Pattern.compile("\\$\\d+");

    private static final Pattern RESULT_AT_END_PATTERN =
            Pattern.compile("(1-0|0-1|1/2-1/2|\\*)\\s*$");

    private static final Pattern SIMPLE_VARIATION_PATTERN =
            Pattern.compile("\\([^()]*\\)");

    @Value("${stockfish.path}")
    private String stockfishPath;

    @Value("${stockfish.depth:12}")
    private int stockfishDepth;

    @Value("${stockfish.threads:1}")
    private int stockfishThreads;

    @Value("${stockfish.hash-mb:64}")
    private int stockfishHashMb;

    public EngineStatusResponse checkEngineStatus() {
        try (EngineSession engine = startEngine()) {
            String engineName = initializeEngine(engine);

            return new EngineStatusResponse(
                    true,
                    "Stockfish is ready.",
                    engineName,
                    resolveEnginePath().toString()
            );

        } catch (Exception exception) {
            return new EngineStatusResponse(
                    false,
                    "Stockfish could not start: " + exception.getMessage(),
                    null,
                    resolveEnginePath().toString()
            );
        }
    }

    public EngineAnalysisResponse runTestAnalysis() {
        try (EngineSession engine = startEngine()) {
            String engineName = initializeEngine(engine);

            engine.sendCommand(
                    "setoption name Threads value " + stockfishThreads
            );

            engine.sendCommand(
                    "setoption name Hash value " + stockfishHashMb
            );

            engine.sendCommand("isready");
            engine.readUntil("readyok", ENGINE_TIMEOUT);

            engine.sendCommand("ucinewgame");

            /*
             * Test position:
             * 1. e4 e5 2. Nf3
             * Black to move.
             */
            engine.sendCommand(
                    "position startpos moves e2e4 e7e5 g1f3"
            );

            engine.sendCommand("go depth " + stockfishDepth);

            EngineInfo latestInfo = null;
            long deadline = System.nanoTime() + ENGINE_TIMEOUT.toNanos();

            while (System.nanoTime() < deadline) {
                if (!engine.reader.ready()) {
                    pauseBriefly();
                    continue;
                }

                String line = engine.reader.readLine();

                if (line == null) {
                    throw new IOException(
                            "Stockfish stopped before returning a best move."
                    );
                }

                if (line.startsWith("info ")) {
                    EngineInfo parsedInfo = parseEngineInfo(line);

                    if (parsedInfo.scoreValue() != null) {
                        latestInfo = parsedInfo;
                    }
                }

                if (line.startsWith("bestmove ")) {
                    String[] parts = line.split("\\s+");
                    String bestMove = parts.length > 1
                            ? parts[1]
                            : "unknown";

                    if (latestInfo == null) {
                        latestInfo = new EngineInfo(
                                null,
                                null,
                                null,
                                null
                        );
                    }

                    return new EngineAnalysisResponse(
                            true,
                            "Stockfish completed the test analysis.",
                            engineName,
                            bestMove,
                            latestInfo.scoreType(),
                            latestInfo.scoreValue(),
                            latestInfo.depth(),
                            latestInfo.principalVariation()
                    );
                }
            }

            throw new IOException(
                    "Stockfish analysis timed out after "
                            + ENGINE_TIMEOUT.getSeconds()
                            + " seconds."
            );

        } catch (Exception exception) {
            return new EngineAnalysisResponse(
                    false,
                    "Stockfish could not analyze the position: "
                            + exception.getMessage(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }
    }
    public EngineAnalysisResponse analyzePosition(
            String rawFen,
            Integer requestedDepth
    ) {
        String fen;

        try {
            fen = validateFen(rawFen);
        } catch (IllegalArgumentException exception) {
            return new EngineAnalysisResponse(
                    false,
                    exception.getMessage(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        int analysisDepth = requestedDepth == null
                ? stockfishDepth
                : Math.max(8, Math.min(requestedDepth, 22));

        try (EngineSession engine = startEngine()) {
            String engineName = initializeEngine(engine);

            engine.sendCommand(
                    "setoption name Threads value " + stockfishThreads
            );

            engine.sendCommand(
                    "setoption name Hash value " + stockfishHashMb
            );

            engine.sendCommand("isready");
            engine.readUntil("readyok", ENGINE_TIMEOUT);

            engine.sendCommand("ucinewgame");
            engine.sendCommand("position fen " + fen);
            engine.sendCommand("go depth " + analysisDepth);

            EngineInfo latestInfo = null;
            long deadline = System.nanoTime() + ENGINE_TIMEOUT.toNanos();

            while (System.nanoTime() < deadline) {
                if (!engine.reader.ready()) {
                    pauseBriefly();
                    continue;
                }

                String line = engine.reader.readLine();

                if (line == null) {
                    throw new IOException(
                            "Stockfish stopped before returning a best move."
                    );
                }

                if (line.startsWith("info ")) {
                    EngineInfo parsedInfo = parseEngineInfo(line);

                    if (parsedInfo.scoreValue() != null) {
                        latestInfo = parsedInfo;
                    }
                }

                if (line.startsWith("bestmove ")) {
                    String[] parts = line.split("\\s+");

                    String bestMove = parts.length > 1
                            ? parts[1]
                            : "unknown";

                    if (latestInfo == null) {
                        latestInfo = new EngineInfo(
                                analysisDepth,
                                null,
                                null,
                                null
                        );
                    }

                    return new EngineAnalysisResponse(
                            true,
                            "Position analyzed successfully.",
                            engineName,
                            bestMove,
                            latestInfo.scoreType(),
                            latestInfo.scoreValue(),
                            latestInfo.depth(),
                            latestInfo.principalVariation()
                    );
                }
            }

            throw new IOException(
                    "Stockfish analysis timed out after "
                            + ENGINE_TIMEOUT.getSeconds()
                            + " seconds."
            );

        } catch (Exception exception) {
            return new EngineAnalysisResponse(
                    false,
                    "Stockfish could not analyze this position: "
                            + exception.getMessage(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }
    }

    private String validateFen(String rawFen) {
        if (rawFen == null || rawFen.isBlank()) {
            throw new IllegalArgumentException(
                    "A chess position is required."
            );
        }

        String fen = rawFen.trim();

        if (fen.contains("\n") || fen.contains("\r")) {
            throw new IllegalArgumentException(
                    "Invalid FEN position."
            );
        }

        String[] parts = fen.split("\\s+");

        if (parts.length != 6) {
            throw new IllegalArgumentException(
                    "Invalid FEN: a complete position must contain 6 fields."
            );
        }

        if (!parts[0].matches("[prnbqkPRNBQK1-8/]+")) {
            throw new IllegalArgumentException(
                    "Invalid FEN board layout."
            );
        }

        if (!parts[1].equals("w") && !parts[1].equals("b")) {
            throw new IllegalArgumentException(
                    "Invalid FEN active color."
            );
        }

        if (!parts[2].equals("-") && !parts[2].matches("[KQkq]+")) {
            throw new IllegalArgumentException(
                    "Invalid FEN castling field."
            );
        }

        if (!parts[3].equals("-") && !parts[3].matches("[a-h][36]")) {
            throw new IllegalArgumentException(
                    "Invalid FEN en passant field."
            );
        }

        try {
            int halfMoveClock = Integer.parseInt(parts[4]);
            int fullMoveNumber = Integer.parseInt(parts[5]);

            if (halfMoveClock < 0 || fullMoveNumber < 1) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "Invalid FEN move counters."
            );
        }

        return fen;
    }
    public FullGameAnalysisResponse analyzeFullGame(
            String rawPgn,
            String requestedMode
    ) {
        String mode = normalizeAnalysisMode(requestedMode);
        int analysisDepth = getDepthForMode(mode);

        try {
            String pgn = normalizePgnForAnalysis(rawPgn);
            Map<String, String> headers = extractPgnHeaders(pgn);
            String moveText = extractMoveTextForAnalysis(pgn);

            if (moveText.isBlank()) {
                return fullGameError(
                        "No playable moves were found in this PGN.",
                        mode
                );
            }

            MoveList moves = new MoveList();
            moves.loadFromSan(moveText);

            if (moves.isEmpty()) {
                return fullGameError(
                        "No playable moves were found in this PGN.",
                        mode
                );
            }

            String[] sanMoves = moves.toSanArray();

            try (EngineSession engine = startEngine()) {
                String engineName = initializeEngine(engine);

                engine.sendCommand(
                        "setoption name Threads value " + stockfishThreads
                );

                engine.sendCommand(
                        "setoption name Hash value " + stockfishHashMb
                );

                engine.sendCommand("isready");
                engine.readUntil("readyok", ENGINE_TIMEOUT);

                engine.sendCommand("ucinewgame");

                Board board = new Board();

                PositionEvaluation currentEvaluation =
                        evaluateFenInSession(
                                engine,
                                board.getFen(),
                                analysisDepth
                        );

                List<MoveAnalysisResponse> analyzedMoves = new ArrayList<>();

                for (int ply = 0; ply < moves.size(); ply++) {
                    Move playedMove = moves.get(ply);

                    String fenBefore = board.getFen();
                    Side movingSide = board.getSideToMove();

                    boolean moveWasApplied = board.doMove(playedMove, true);

                    if (!moveWasApplied) {
                        throw new IOException(
                                "Could not replay move "
                                        + (ply + 1)
                                        + " from the PGN."
                        );
                    }

                    String fenAfter = board.getFen();

                    PositionEvaluation evaluationAfter =
                            evaluateFenInSession(
                                    engine,
                                    fenAfter,
                                    analysisDepth
                            );

                    int evaluationBeforeWhiteCp =
                            normalizeToWhitePerspective(
                                    currentEvaluation.engineInfo(),
                                    movingSide
                            );

                    int evaluationAfterWhiteCp =
                            normalizeToWhitePerspective(
                                    evaluationAfter.engineInfo(),
                                    board.getSideToMove()
                            );

                    Integer mateBeforeWhite =
                            normalizeMateToWhitePerspective(
                                    currentEvaluation.engineInfo(),
                                    movingSide
                            );

                    Integer mateAfterWhite =
                            normalizeMateToWhitePerspective(
                                    evaluationAfter.engineInfo(),
                                    board.getSideToMove()
                            );

                    int evaluationBeforeForMover =
                            movingSide == Side.WHITE
                                    ? evaluationBeforeWhiteCp
                                    : -evaluationBeforeWhiteCp;

                    int evaluationAfterForMover =
                            movingSide == Side.WHITE
                                    ? evaluationAfterWhiteCp
                                    : -evaluationAfterWhiteCp;

                    int centipawnLoss = Math.max(
                            0,
                            evaluationBeforeForMover - evaluationAfterForMover
                    );

                    String playedMoveUci = playedMove.toString();

                    String classification = classifyMove(
                            playedMoveUci,
                            currentEvaluation.bestMoveUci(),
                            centipawnLoss
                    );

                    String san = ply < sanMoves.length
                            ? sanMoves[ply]
                            : playedMoveUci;

                    analyzedMoves.add(
                            new MoveAnalysisResponse(
                                    ply + 1,
                                    (ply / 2) + 1,
                                    movingSide == Side.WHITE
                                            ? "white"
                                            : "black",
                                    san,
                                    playedMoveUci,
                                    fenBefore,
                                    fenAfter,

                                    // Best move before the player made their move.
                                    currentEvaluation.bestMoveUci(),

                                    // Stockfish best reply after the played move.
                                    evaluationAfter.bestMoveUci(),

                                    evaluationBeforeWhiteCp,
                                    evaluationAfterWhiteCp,
                                    centipawnLoss,
                                    classification,
                                    currentEvaluation.engineInfo().depth(),

                                    // Best line before the player made their move.
                                    currentEvaluation.engineInfo()
                                            .principalVariation(),

                                    // Best line after the player made their move.
                                    evaluationAfter.engineInfo()
                                            .principalVariation(),

                                    mateBeforeWhite,
                                    mateAfterWhite
                            )
                    );

                    currentEvaluation = evaluationAfter;
                }
                PlayerAnalysisSummaryResponse whiteSummary =
                        buildPlayerSummary("white", analyzedMoves);

                PlayerAnalysisSummaryResponse blackSummary =
                        buildPlayerSummary("black", analyzedMoves);

                return new FullGameAnalysisResponse(
                        true,
                        "Full game analysis completed.",
                        mode,
                        analysisDepth,
                        engineName,
                        getPgnHeader(headers, "white", "White Player"),
                        getPgnHeader(headers, "black", "Black Player"),
                        (moves.size() + 1) / 2,
                        whiteSummary,
                        blackSummary,
                        analyzedMoves
                );
            }

        } catch (Exception exception) {
            return fullGameError(
                    "ChessVision could not analyze this game: "
                            + exception.getMessage(),
                    mode
            );
        }
    }

    private PositionEvaluation evaluateFenInSession(
            EngineSession engine,
            String fen,
            int depth
    ) throws IOException {
        validateFen(fen);

        engine.sendCommand("position fen " + fen);
        engine.sendCommand("go depth " + depth);

        EngineInfo latestInfo = null;

        long deadline = System.nanoTime() + ENGINE_TIMEOUT.toNanos();

        while (System.nanoTime() < deadline) {
            if (!engine.reader.ready()) {
                pauseBriefly();
                continue;
            }

            String line = engine.reader.readLine();

            if (line == null) {
                throw new IOException(
                        "Stockfish stopped before returning a best move."
                );
            }

            if (line.startsWith("info ")) {
                EngineInfo parsedInfo = parseEngineInfo(line);

                if (parsedInfo.scoreValue() != null) {
                    latestInfo = parsedInfo;
                }
            }

            if (line.startsWith("bestmove ")) {
                String[] parts = line.split("\\s+");

                String bestMoveUci = parts.length > 1
                        ? parts[1]
                        : "unknown";

                if (latestInfo == null
                        || latestInfo.scoreValue() == null) {
                    throw new IOException(
                            "Stockfish returned no evaluation for this position."
                    );
                }

                return new PositionEvaluation(
                        bestMoveUci,
                        latestInfo
                );
            }
        }

        throw new IOException(
                "Stockfish timed out while analyzing a game position."
        );
    }

    private String normalizeAnalysisMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return "standard";
        }

        String normalized = mode.trim().toLowerCase(Locale.ROOT);

        return switch (normalized) {
            case "quick", "standard", "deep" -> normalized;
            default -> "standard";
        };
    }

    private int getDepthForMode(String mode) {
        return switch (mode) {
            case "quick" -> 12;
            case "deep" -> 20;
            default -> 16;
        };
    }

    private int normalizeToWhitePerspective(
            EngineInfo engineInfo,
            Side sideToMove
    ) {
        int rawScore = convertEngineScoreToCentipawns(engineInfo);

        return sideToMove == Side.WHITE
                ? rawScore
                : -rawScore;
    }

    private Integer normalizeMateToWhitePerspective(
            EngineInfo engineInfo,
            Side sideToMove
    ) {
        if (
                engineInfo.scoreValue() == null
                        || !"mate".equals(engineInfo.scoreType())
        ) {
            return null;
        }

        return sideToMove == Side.WHITE
                ? engineInfo.scoreValue()
                : -engineInfo.scoreValue();
    }

    private int convertEngineScoreToCentipawns(
            EngineInfo engineInfo
    ) {
        if (engineInfo.scoreValue() == null) {
            throw new IllegalArgumentException(
                    "Engine evaluation is missing."
            );
        }

        if ("mate".equals(engineInfo.scoreType())) {
            int mateDistance = Math.min(
                    Math.abs(engineInfo.scoreValue()),
                    99
            );

            int mateScore = 100_000 - (mateDistance * 100);

            return engineInfo.scoreValue() > 0
                    ? mateScore
                    : -mateScore;
        }

        return engineInfo.scoreValue();
    }

    private String classifyMove(
            String playedMoveUci,
            String bestMoveUci,
            int centipawnLoss
    ) {
        if (playedMoveUci.equals(bestMoveUci) || centipawnLoss <= 10) {
            return "Best Move";
        }

        if (centipawnLoss <= 25) {
            return "Excellent";
        }

        if (centipawnLoss <= 50) {
            return "Good Move";
        }

        if (centipawnLoss <= 100) {
            return "Inaccuracy";
        }

        if (centipawnLoss <= 220) {
            return "Mistake";
        }

        return "Blunder";
    }

    private String normalizePgnForAnalysis(String rawPgn) {
        return rawPgn
                .replace("\uFEFF", "")
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .trim();
    }

    private Map<String, String> extractPgnHeaders(String pgn) {
        Map<String, String> headers = new HashMap<>();

        for (String line : pgn.split("\\R")) {
            Matcher matcher = PGN_HEADER_PATTERN.matcher(line);

            if (matcher.matches()) {
                headers.put(
                        matcher.group(1).toLowerCase(Locale.ROOT),
                        matcher.group(2).trim()
                );
            }
        }

        return headers;
    }

    private String extractMoveTextForAnalysis(String pgn) {
        StringBuilder moveText = new StringBuilder();

        for (String line : pgn.split("\\R")) {
            if (!PGN_HEADER_PATTERN.matcher(line).matches()) {
                moveText.append(line).append("\n");
            }
        }

        String cleaned = moveText.toString();

        cleaned = BRACE_COMMENT_PATTERN.matcher(cleaned).replaceAll(" ");
        cleaned = LINE_COMMENT_PATTERN.matcher(cleaned).replaceAll(" ");
        cleaned = NAG_PATTERN.matcher(cleaned).replaceAll(" ");

        String previous;

        do {
            previous = cleaned;
            cleaned = SIMPLE_VARIATION_PATTERN
                    .matcher(cleaned)
                    .replaceAll(" ");
        } while (!cleaned.equals(previous));

        cleaned = RESULT_AT_END_PATTERN
                .matcher(cleaned.trim())
                .replaceAll("");

        return cleaned
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String getPgnHeader(
            Map<String, String> headers,
            String key,
            String fallbackValue
    ) {
        String value = headers.get(key);

        return value == null || value.isBlank()
                ? fallbackValue
                : value;
    }

    private FullGameAnalysisResponse fullGameError(
            String message,
            String mode
    ) {
        return new FullGameAnalysisResponse(
                false,
                message,
                mode,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of()
        );
    }

    private record PositionEvaluation(
            String bestMoveUci,
            EngineInfo engineInfo
    ) {
    }
    private PlayerAnalysisSummaryResponse buildPlayerSummary(
            String side,
            List<MoveAnalysisResponse> analyzedMoves
    ) {
        int movesPlayed = 0;
        int bestMoves = 0;
        int excellentMoves = 0;
        int goodMoves = 0;
        int inaccuracies = 0;
        int mistakes = 0;
        int blunders = 0;

        double totalCentipawnLoss = 0;

        for (MoveAnalysisResponse move : analyzedMoves) {
            if (!side.equals(move.side())) {
                continue;
            }

            movesPlayed++;

            if (move.centipawnLoss() != null) {
                totalCentipawnLoss += move.centipawnLoss();
            }

            String classification = move.classification();

            if ("Best Move".equals(classification)) {
                bestMoves++;
            } else if ("Excellent".equals(classification)) {
                excellentMoves++;
            } else if ("Good Move".equals(classification)) {
                goodMoves++;
            } else if ("Inaccuracy".equals(classification)) {
                inaccuracies++;
            } else if ("Mistake".equals(classification)) {
                mistakes++;
            } else if ("Blunder".equals(classification)) {
                blunders++;
            }
        }

        double averageCentipawnLoss = movesPlayed == 0
                ? 0
                : totalCentipawnLoss / movesPlayed;

        double accuracy = calculateChessVisionAccuracy(
                averageCentipawnLoss,
                blunders,
                mistakes
        );

        return new PlayerAnalysisSummaryResponse(
                side,
                accuracy,
                roundOneDecimal(averageCentipawnLoss),
                movesPlayed,
                bestMoves,
                excellentMoves,
                goodMoves,
                inaccuracies,
                mistakes,
                blunders
        );
    }

    private double calculateChessVisionAccuracy(
            double averageCentipawnLoss,
            int blunders,
            int mistakes
    ) {
        /*
         * Transparent first-version formula:
         *
         * Lower average centipawn loss = higher score.
         * Blunders and mistakes receive an additional penalty.
         *
         * This is ChessVision Accuracy, not Chess.com Accuracy.
         */
        double baseScore =
                100.0 * Math.exp(-averageCentipawnLoss / 105.0);

        double criticalErrorPenalty =
                (blunders * 2.0) + (mistakes * 0.75);

        double finalScore = baseScore - criticalErrorPenalty;

        finalScore = Math.max(0, Math.min(100, finalScore));

        return roundOneDecimal(finalScore);
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private EngineSession startEngine() throws IOException {
        Path enginePath = resolveEnginePath();

        if (!Files.isRegularFile(enginePath)) {
            throw new IOException(
                    "Engine file was not found at: " + enginePath
            );
        }

        ProcessBuilder processBuilder =
                new ProcessBuilder(enginePath.toString());

        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        process.getInputStream(),
                        StandardCharsets.UTF_8
                )
        );

        BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(
                        process.getOutputStream(),
                        StandardCharsets.UTF_8
                )
        );

        return new EngineSession(process, reader, writer);
    }

    private Path resolveEnginePath() {
        return Path.of(stockfishPath)
                .toAbsolutePath()
                .normalize();
    }

    private String initializeEngine(EngineSession engine)
            throws IOException {

        engine.sendCommand("uci");

        List<String> uciOutput =
                engine.readUntil("uciok", ENGINE_TIMEOUT);

        String engineName = "Unknown Stockfish build";

        for (String line : uciOutput) {
            Matcher matcher = ENGINE_NAME_PATTERN.matcher(line);

            if (matcher.matches()) {
                engineName = matcher.group(1);
                break;
            }
        }

        engine.sendCommand("isready");
        engine.readUntil("readyok", ENGINE_TIMEOUT);

        return engineName;
    }

    private EngineInfo parseEngineInfo(String line) {
        Integer depth = findInteger(DEPTH_PATTERN, line);
        Integer scoreValue = findInteger(SCORE_PATTERN, line, 2);

        String scoreType = null;
        Matcher scoreMatcher = SCORE_PATTERN.matcher(line);

        if (scoreMatcher.find()) {
            scoreType = scoreMatcher.group(1);
        }

        String principalVariation = null;
        Matcher pvMatcher = PRINCIPAL_VARIATION_PATTERN.matcher(line);

        if (pvMatcher.find()) {
            principalVariation = pvMatcher.group(1);
        }

        return new EngineInfo(
                depth,
                scoreType,
                scoreValue,
                principalVariation
        );
    }

    private Integer findInteger(Pattern pattern, String text) {
        return findInteger(pattern, text, 1);
    }

    private Integer findInteger(
            Pattern pattern,
            String text,
            int group
    ) {
        Matcher matcher = pattern.matcher(text);

        if (!matcher.find()) {
            return null;
        }

        return Integer.parseInt(matcher.group(group));
    }

    private void pauseBriefly() throws IOException {
        try {
            Thread.sleep(10);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IOException(
                    "Stockfish processing was interrupted.",
                    exception
            );
        }
    }

    private record EngineInfo(
            Integer depth,
            String scoreType,
            Integer scoreValue,
            String principalVariation
    ) {
    }

    private static class EngineSession implements AutoCloseable {

        private final Process process;
        private final BufferedReader reader;
        private final BufferedWriter writer;

        private EngineSession(
                Process process,
                BufferedReader reader,
                BufferedWriter writer
        ) {
            this.process = process;
            this.reader = reader;
            this.writer = writer;
        }

        private void sendCommand(String command) throws IOException {
            writer.write(command);
            writer.newLine();
            writer.flush();
        }

        private List<String> readUntil(
                String expectedLine,
                Duration timeout
        ) throws IOException {
            List<String> lines = new ArrayList<>();
            long deadline = System.nanoTime() + timeout.toNanos();

            while (System.nanoTime() < deadline) {
                if (!reader.ready()) {
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();

                        throw new IOException(
                                "Stockfish initialization was interrupted.",
                                exception
                        );
                    }

                    continue;
                }

                String line = reader.readLine();

                if (line == null) {
                    throw new IOException(
                            "Stockfish closed unexpectedly."
                    );
                }

                lines.add(line);

                if (line.equals(expectedLine)) {
                    return lines;
                }
            }

            throw new IOException(
                    "Timed out while waiting for Stockfish response: "
                            + expectedLine
            );
        }

        @Override
        public void close() {
            try {
                if (process.isAlive()) {
                    sendCommand("quit");
                }
            } catch (IOException ignored) {
                // The process may already be closed.
            }

            try {
                if (process.isAlive()
                        && !process.waitFor(2, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                process.destroyForcibly();
            }

            try {
                reader.close();
            } catch (IOException ignored) {
            }

            try {
                writer.close();
            } catch (IOException ignored) {
            }
        }




    }
}