import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import AppShell from "../components/layout/AppShell";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";
import GuestAnalysisShell from "../components/layout/GuestAnalysisShell";
import { useAuth } from "../context/AuthContext";

const DEMO_PGN = `[Event "ChessVision Demo Game"]
[Site "ChessVision"]
[Date "2026.06.29"]
[Round "1"]
[White "Martin"]
[Black "TacticalWolf"]
[Result "*"]

1. e4 e5
2. Nf3 Nc6
3. Bb5 a6
4. Ba4 Nf6
5. O-O Be7
6. Re1 b5
7. Bb3 d6
8. c3 O-O
9. h3 Nb8
10. d4 Nbd7
11. c4 c6
12. Nc3 Bb7
13. a3 Re8
14. Ba2 Bf8
15. cxb5 axb5
16. Ng5 Re7
17. d5 cxd5
18. Nxd5 Nxd5
19. Bxd5 Bxd5
20. Qxd5 *`;

const moveQualityClasses = {
    "Best Move": "move-quality-best",
    Excellent: "move-quality-excellent",
    "Good Move": "move-quality-good",
    Inaccuracy: "move-quality-inaccuracy",
    Mistake: "move-quality-mistake",
    Blunder: "move-quality-blunder",
};

function getWhiteEvaluationPercentage(centipawns) {
    if (typeof centipawns !== "number") {
        return 50;
    }

    /*
     * -800 cp = fully Black side
     * 0 cp    = equal position
     * +800 cp = fully White side
     *
     * Everything above/below ±8 pawns is visually capped,
     * so the bar remains usable even in winning positions.
     */
    const cappedScore = Math.max(-800, Math.min(800, centipawns));

    return 50 + cappedScore / 16;
}

function formatEvaluationBarScore(centipawns) {
    if (typeof centipawns !== "number") {
        return "0.00";
    }

    const cappedScore = Math.max(-800, Math.min(800, centipawns));
    const score = cappedScore / 100;

    return `${score >= 0 ? "+" : ""}${score.toFixed(2)}`;
}

function getEvaluationDescription(centipawns) {
    if (typeof centipawns !== "number" || Math.abs(centipawns) < 20) {
        return "Position is approximately equal";
    }

    if (centipawns > 0) {
        return "White is better";
    }

    return "Black is better";
}

function getMoveQualityClass(classification) {
    return moveQualityClasses[classification] || "";
}

function formatAccuracy(value) {
    if (typeof value !== "number") {
        return "—";
    }

    return `${value.toFixed(1)}%`;
}

function formatAverageCpl(value) {
    if (typeof value !== "number") {
        return "—";
    }

    return `${value.toFixed(1)} CPL`;
}

function getPgnHeader(pgn, headerName, fallbackValue) {
    const match = pgn.match(
        new RegExp(`\\[${headerName}\\s+"([^"]*)"\\]`, "i"),
    );

    return match ? match[1] : fallbackValue;
}

function parsePgn(pgn) {
    const game = new Chess();

    game.loadPgn(pgn);

    const moves = game.history({ verbose: true });

    if (moves.length === 0) {
        throw new Error("No valid moves were found in this PGN.");
    }

    return moves;
}

function formatPawnLoss(centipawns) {
    if (typeof centipawns !== "number") {
        return "0.0";
    }

    return (centipawns / 100).toFixed(1);
}

function getEvaluationShift(beforeCp, afterCp) {
    if (
        typeof beforeCp !== "number" ||
        typeof afterCp !== "number"
    ) {
        return "The engine evaluation changed after the move.";
    }

    const difference = afterCp - beforeCp;
    const shiftInPawns = Math.abs(difference / 100).toFixed(1);

    if (Math.abs(difference) < 15) {
        return "The engine evaluation stayed almost unchanged.";
    }

    if (difference > 0) {
        return `The position shifted about ${shiftInPawns} pawns in White's favor.`;
    }

    return `The position shifted about ${shiftInPawns} pawns in Black's favor.`;
}

function buildMoveFeedback(
    moveAnalysis,
    whitePlayer,
    blackPlayer,
    recommendedMove,
) {
    const player =
        moveAnalysis.side === "white" ? whitePlayer : blackPlayer;

    const centipawnLoss = moveAnalysis.centipawnLoss || 0;

    const positionShift = getEvaluationShift(
        moveAnalysis.evaluationBeforeWhiteCp,
        moveAnalysis.evaluationAfterWhiteCp,
    );

    const bestMoveText = recommendedMove
        ? `Stockfish preferred ${recommendedMove}.`
        : "Stockfish found a stronger continuation.";

    switch (moveAnalysis.classification) {
        case "Best Move":
            return {
                title: "Excellent decision.",
                text: `${player} chose Stockfish's strongest move. The move preserved the position and kept the engine evaluation stable.`,
                detail: positionShift,
                critical: false,
            };

        case "Excellent":
            return {
                title: "Very accurate move.",
                text: `${player} played a move that was very close to Stockfish's top recommendation. Only a very small amount of engine value was lost.`,
                detail: `${positionShift} ${bestMoveText}`,
                critical: false,
            };

        case "Good Move":
            return {
                title: "Solid practical move.",
                text: `${player} kept the position playable, although Stockfish found a slightly stronger continuation.`,
                detail: `${positionShift} ${bestMoveText}`,
                critical: false,
            };

        case "Inaccuracy":
            return {
                title: "A small opportunity was missed.",
                text: `${player} gave up roughly ${formatPawnLoss(
                    centipawnLoss,
                )} pawns of engine value. The move was not losing, but it made the position less precise.`,
                detail: `${positionShift} ${bestMoveText}`,
                critical: false,
            };

        case "Mistake":
            return {
                title: "This changed the character of the position.",
                text: `${player} lost roughly ${formatPawnLoss(
                    centipawnLoss,
                )} pawns of engine value. Stockfish considers the alternative significantly stronger.`,
                detail: `${positionShift} ${bestMoveText}`,
                critical: true,
            };

        case "Blunder":
            return {
                title: "Critical error detected.",
                text: `${player} lost roughly ${formatPawnLoss(
                    centipawnLoss,
                )} pawns of engine value. This move caused a major evaluation swing and gave the opponent a much stronger position.`,
                detail: `${positionShift} ${bestMoveText}`,
                critical: true,
            };

        default:
            return {
                title: "Move analysis",
                text: "ChessVision analyzed this move using Stockfish.",
                detail: positionShift,
                critical: false,
            };
    }
}
const pieceNames = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king",
};

function getBestResponseCapture(moveAnalysis) {
    if (
        !moveAnalysis?.bestResponseUci ||
        !moveAnalysis?.fenAfter ||
        moveAnalysis.bestResponseUci.length < 4
    ) {
        return null;
    }

    try {
        const responseUci = moveAnalysis.bestResponseUci;

        const responsePosition = new Chess(moveAnalysis.fenAfter);

        const targetSquare = responseUci.slice(2, 4);
        const capturedPiece = responsePosition.get(targetSquare);

        const responseMove = responsePosition.move({
            from: responseUci.slice(0, 2),
            to: targetSquare,
            promotion:
                responseUci.length > 4 ? responseUci.slice(4, 5) : undefined,
        });

        if (!responseMove || !capturedPiece) {
            return null;
        }

        return {
            san: responseMove.san,
            piece: pieceNames[capturedPiece.type] || "piece",
            color: capturedPiece.color === "w" ? "white" : "black",
        };
    } catch {
        return null;
    }
}

function buildDetectedReason(moveAnalysis, whitePlayer, blackPlayer) {
    if (!moveAnalysis) {
        return null;
    }

    const isCriticalMove =
        moveAnalysis.classification === "Mistake" ||
        moveAnalysis.classification === "Blunder";

    if (!isCriticalMove) {
        return null;
    }

    const captureInsight = getBestResponseCapture(moveAnalysis);

    if (!captureInsight) {
        return null;
    }

    const movingPlayer =
        moveAnalysis.side === "white" ? whitePlayer : blackPlayer;

    const opponentPlayer =
        moveAnalysis.side === "white" ? blackPlayer : whitePlayer;

    const movingColor =
        moveAnalysis.side === "white" ? "white" : "black";

    // We only describe it as a loss if the opponent's response
    // captures a piece belonging to the player who made the mistake.
    if (captureInsight.color !== movingColor) {
        return null;
    }

    return {
        title: "Material loss detected",
        text: `${moveAnalysis.san} allowed ${opponentPlayer} to respond with ${captureInsight.san}, winning ${movingPlayer}'s ${captureInsight.piece}.`,
        detail: `Stockfish identifies ${captureInsight.san} as the strongest response after this move.`,
    };
}

function getPlayerEvaluation(whiteEvaluationCp, side) {
    if (typeof whiteEvaluationCp !== "number") {
        return null;
    }

    return side === "white"
        ? whiteEvaluationCp
        : -whiteEvaluationCp;
}

function getPlayerMateScore(whiteMateScore, side) {
    if (typeof whiteMateScore !== "number") {
        return null;
    }

    return side === "white"
        ? whiteMateScore
        : -whiteMateScore;
}

function formatPlayerEvaluation(centipawns) {
    if (typeof centipawns !== "number") {
        return "—";
    }

    const pawns = centipawns / 100;

    return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

function buildMissedMateReason(
    moveAnalysis,
    whitePlayer,
    blackPlayer,
    recommendedMove,
) {
    if (!moveAnalysis) {
        return null;
    }

    const mateBeforeForPlayer = getPlayerMateScore(
        moveAnalysis.mateBeforeWhite,
        moveAnalysis.side,
    );

    const mateAfterForPlayer = getPlayerMateScore(
        moveAnalysis.mateAfterWhite,
        moveAnalysis.side,
    );

    const player =
        moveAnalysis.side === "white" ? whitePlayer : blackPlayer;

    /*
     * Before the move, the player had a forced mate.
     * After the move, that forced mate no longer exists.
     */
    if (
        typeof mateBeforeForPlayer !== "number" ||
        mateBeforeForPlayer <= 0 ||
        (typeof mateAfterForPlayer === "number" && mateAfterForPlayer > 0)
    ) {
        return null;
    }

    return {
        icon: "#",
        title: "Forced mate was missed",
        text: `${player} had a forced mate in ${mateBeforeForPlayer}, but ${moveAnalysis.san} allowed that mating sequence to disappear.`,
        detail: recommendedMove
            ? `Stockfish's winning move was ${recommendedMove}.`
            : "Stockfish found a forced mating continuation before this move.",
    };
}

function buildLostWinningAdvantageReason(
    moveAnalysis,
    whitePlayer,
    blackPlayer,
    recommendedMove,
) {
    if (!moveAnalysis) {
        return null;
    }

    const isCritical =
        moveAnalysis.classification === "Mistake" ||
        moveAnalysis.classification === "Blunder";

    if (!isCritical) {
        return null;
    }

    /*
     * We skip mate positions here because the Missed Mate detector
     * explains them more precisely.
     */
    if (
        typeof moveAnalysis.mateBeforeWhite === "number" ||
        typeof moveAnalysis.mateAfterWhite === "number"
    ) {
        return null;
    }

    const evaluationBeforeForPlayer = getPlayerEvaluation(
        moveAnalysis.evaluationBeforeWhiteCp,
        moveAnalysis.side,
    );

    const evaluationAfterForPlayer = getPlayerEvaluation(
        moveAnalysis.evaluationAfterWhiteCp,
        moveAnalysis.side,
    );

    if (
        typeof evaluationBeforeForPlayer !== "number" ||
        typeof evaluationAfterForPlayer !== "number"
    ) {
        return null;
    }

    /*
     * Player had at least +3.00 advantage,
     * then dropped near equality or worse.
     */
    const hadWinningAdvantage = evaluationBeforeForPlayer >= 300;
    const advantageWasLost = evaluationAfterForPlayer <= 80;

    if (!hadWinningAdvantage || !advantageWasLost) {
        return null;
    }

    const player =
        moveAnalysis.side === "white" ? whitePlayer : blackPlayer;

    return {
        icon: "↘",
        title: "Winning advantage was lost",
        text: `Before ${moveAnalysis.san}, ${player} had a winning evaluation of ${formatPlayerEvaluation(
            evaluationBeforeForPlayer,
        )}. After the move, the advantage dropped to ${formatPlayerEvaluation(
            evaluationAfterForPlayer,
        )}.`,
        detail: recommendedMove
            ? `Stockfish preferred ${recommendedMove} to keep the winning position.`
            : "Stockfish found a stronger continuation that maintained the advantage.",
    };
}

function createArrowFromUci(uciMove, color = "rgba(74, 222, 128, 0.88)") {
    if (
        !uciMove ||
        uciMove === "unknown" ||
        uciMove === "(none)" ||
        uciMove.length < 4
    ) {
        return [];
    }

    return [
        {
            startSquare: uciMove.slice(0, 2),
            endSquare: uciMove.slice(2, 4),
            color,
        },
    ];
}

function ReviewGamePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const PageShell = user ? AppShell : GuestAnalysisShell;
    const { gameId } = useParams();

    const [savedReview, setSavedReview] = useState(null);
    const [isSavedReviewLoading, setIsSavedReviewLoading] = useState(
        Boolean(gameId),
    );
    const [savedReviewError, setSavedReviewError] = useState("");

    useEffect(() => {
        if (!gameId) {
            setSavedReview(null);
            setSavedReviewError("");
            setIsSavedReviewLoading(false);
            return;
        }

        const controller = new AbortController();

        async function loadSavedReview() {
            setIsSavedReviewLoading(true);
            setSavedReviewError("");

            try {
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError || !session?.access_token) {
                    throw new Error(
                        "Your login session has expired. Please log in again.",
                    );
                }

                const response = await fetch(
                    `${API_BASE_URL}/api/games/${gameId}/review`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        signal: controller.signal,
                    },
                );

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.detail ||
                        "Could not load this saved analysis.",
                    );
                }

                setSavedReview(data);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setSavedReviewError(
                        error.message ||
                        "Could not load this saved analysis.",
                    );
                }
            } finally {
                setIsSavedReviewLoading(false);
            }
        }

        loadSavedReview();

        return () => controller.abort();
    }, [gameId]);

    const gameData = useMemo(() => {
        const receivedPgn = savedReview?.pgn?.trim() || location.state?.pgn?.trim();
        const requestedPgn = receivedPgn || DEMO_PGN;

        try {
            return {
                pgn: requestedPgn,
                moves: parsePgn(requestedPgn),
                usingDemoGame: !receivedPgn,
                parseError: "",
            };
        } catch {
            return {
                pgn: DEMO_PGN,
                moves: parsePgn(DEMO_PGN),
                usingDemoGame: true,
                parseError:
                    "The imported PGN could not be read, so ChessVision loaded a demo game instead.",
            };
        }
    }, [savedReview?.pgn, location.state?.pgn]);

    const [showBestMoveArrow, setShowBestMoveArrow] = useState(true);

    const [currentPly, setCurrentPly] = useState(0);
    const [boardOrientation, setBoardOrientation] = useState("white");

    const { moves, pgn, usingDemoGame, parseError } = gameData;

    const fullGameAnalysis =
        savedReview?.fullGameAnalysis ||
        location.state?.fullGameAnalysis ||
        null;

    const whiteSummary = fullGameAnalysis?.whiteSummary || null;
    const blackSummary = fullGameAnalysis?.blackSummary || null;

    const totalBestMoves =
        (whiteSummary?.bestMoves || 0) + (blackSummary?.bestMoves || 0);

    const totalMistakes =
        (whiteSummary?.mistakes || 0) + (blackSummary?.mistakes || 0);

    const totalBlunders =
        (whiteSummary?.blunders || 0) + (blackSummary?.blunders || 0);

    const analysisByPly = useMemo(() => {
        return new Map(
            (fullGameAnalysis?.moves || []).map((move) => [move.ply, move]),
        );
    }, [fullGameAnalysis]);

    const currentMove = currentPly > 0 ? moves[currentPly - 1] : null;

    const selectedMoveAnalysis =
        currentPly > 0 ? analysisByPly.get(currentPly) : null;

    const boardEvaluationCp =
        selectedMoveAnalysis?.evaluationAfterWhiteCp ?? 0;

    const whiteEvaluationPercentage =
        getWhiteEvaluationPercentage(boardEvaluationCp);

    const evaluationBarScore =
        formatEvaluationBarScore(boardEvaluationCp);

    const evaluationDescription =
        getEvaluationDescription(boardEvaluationCp);

    const currentPosition = currentMove
        ? currentMove.after
        : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    const positionToAnalyze =
        selectedMoveAnalysis?.fenBefore || currentPosition;

    const recommendedMoveUci = selectedMoveAnalysis?.bestMoveUci || null;

    const shouldShowRecommendation =
        showBestMoveArrow &&
        Boolean(selectedMoveAnalysis?.fenBefore && recommendedMoveUci);

    const boardPosition = shouldShowRecommendation
        ? selectedMoveAnalysis.fenBefore
        : currentPosition;

    const bestMoveArrows = shouldShowRecommendation
        ? createArrowFromUci(recommendedMoveUci)
        : [];

    const movePairs = [];

    const analysisDepths = {
        quick: 12,
        standard: 16,
        deep: 20,
    };

    const selectedAnalysisMode =
        fullGameAnalysis?.mode ||
        location.state?.analysisMode ||
        "standard";    const requestedDepth = analysisDepths[selectedAnalysisMode] || 16;

    for (let index = 0; index < moves.length; index += 2) {
        movePairs.push({
            moveNumber: Math.floor(index / 2) + 1,
            whiteMove: moves[index],
            blackMove: moves[index + 1],
            whitePly: index + 1,
            blackPly: index + 2,
        });
    }

    const highlightedSquares = shouldShowRecommendation
        ? {
            [recommendedMoveUci.slice(0, 2)]: {
                background:
                    "radial-gradient(circle, rgba(74, 222, 128, 0.45) 0%, rgba(74, 222, 128, 0.12) 65%, transparent 67%)",
            },

            [recommendedMoveUci.slice(2, 4)]: {
                background:
                    "radial-gradient(circle, rgba(134, 239, 172, 0.58) 0%, rgba(134, 239, 172, 0.18) 65%, transparent 67%)",
            },
        }
        : currentMove
            ? {
                [currentMove.from]: {
                    background:
                        "radial-gradient(circle, rgba(250, 204, 21, 0.56) 0%, rgba(250, 204, 21, 0.18) 65%, transparent 67%)",
                },

                [currentMove.to]: {
                    background:
                        "radial-gradient(circle, rgba(74, 222, 128, 0.62) 0%, rgba(74, 222, 128, 0.2) 65%, transparent 67%)",
                },
            }
            : {};

    const chessboardOptions = {
        id: "chessvision-review-board",
        position: boardPosition,
        arrows: bestMoveArrows,
        boardOrientation,
        allowDragging: false,
        showNotation: true,
        showAnimations: true,
        animationDurationInMs: 220,
        squareStyles: highlightedSquares,
        darkSquareStyle: {
            backgroundColor: "#3d6f4e",
        },
        lightSquareStyle: {
            backgroundColor: "#d9e7da",
        },
    };

    const [engineResult, setEngineResult] = useState(null);
    const [isAnalyzingPosition, setIsAnalyzingPosition] = useState(false);
    const [engineError, setEngineError] = useState("");

    function goToStart() {
        setCurrentPly(0);
    }

    function goToPreviousMove() {
        setCurrentPly((previousPly) => Math.max(0, previousPly - 1));
    }

    function goToNextMove() {
        setCurrentPly((previousPly) =>
            Math.min(moves.length, previousPly + 1),
        );
    }

    function goToEnd() {
        setCurrentPly(moves.length);
    }

    function flipBoard() {
        setBoardOrientation((previousOrientation) =>
            previousOrientation === "white" ? "black" : "white",
        );
    }

    const whitePlayer = getPgnHeader(pgn, "White", "White Player");
    const blackPlayer = getPgnHeader(pgn, "Black", "Black Player");
    const gameResult = getPgnHeader(pgn, "Result", "*");
    const eventName = getPgnHeader(pgn, "Event", "Imported Game");

    const selectedBestMove = selectedMoveAnalysis
        ? formatUciMoveAsSan(
            selectedMoveAnalysis.bestMoveUci,
            selectedMoveAnalysis.fenBefore,
        )
        : null;

    const selectedMoveFeedback = selectedMoveAnalysis
        ? buildMoveFeedback(
            selectedMoveAnalysis,
            whitePlayer,
            blackPlayer,
            selectedBestMove,
        )
        : null;

    const detectedReasons = selectedMoveAnalysis
        ? [
            buildMissedMateReason(
                selectedMoveAnalysis,
                whitePlayer,
                blackPlayer,
                selectedBestMove,
            ),

            buildDetectedReason(
                selectedMoveAnalysis,
                whitePlayer,
                blackPlayer,
            ),

            buildLostWinningAdvantageReason(
                selectedMoveAnalysis,
                whitePlayer,
                blackPlayer,
                selectedBestMove,
            ),
        ].filter(Boolean)
        : [];

    const currentMoveLabel = currentMove
        ? `${Math.ceil(currentPly / 2)}${
            currentMove.color === "w" ? "." : "..."
        } ${currentMove.san}`
        : "Starting position";

    function formatUciMoveAsSan(uciMove, fen) {
        if (!uciMove || uciMove === "unknown" || uciMove === "(none)") {
            return "—";
        }

        try {
            const position = new Chess(fen);

            const move = position.move({
                from: uciMove.slice(0, 2),
                to: uciMove.slice(2, 4),
                promotion: uciMove.length > 4 ? uciMove[4] : undefined,
            });

            return move?.san || uciMove;
        } catch {
            return uciMove;
        }
    }

    function formatBestMove(uciMove) {
        return formatUciMoveAsSan(uciMove, positionToAnalyze);
    }

    function formatWhiteEvaluation(centipawns) {
        if (centipawns === null || centipawns === undefined) {
            return "—";
        }

        const score = centipawns / 100;

        return `${score >= 0 ? "+" : ""}${score.toFixed(2)}`;
    }

    function formatEngineScore(result) {
        if (!result?.scoreType || result.scoreValue === null) {
            return "—";
        }

        if (result.scoreType === "mate") {
            return `Mate in ${Math.abs(result.scoreValue)}`;
        }

        const score = result.scoreValue / 100;

        return `${score >= 0 ? "+" : ""}${score.toFixed(2)}`;
    }

    async function analyzeCurrentPosition() {
        setIsAnalyzingPosition(true);
        setEngineError("");
        setEngineResult(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/engine/analyze-position`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fen: positionToAnalyze,
                        depth: requestedDepth,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok || !data.available) {
                setEngineError(
                    data.message || "ChessVision could not analyze this position.",
                );
                return;
            }

            setEngineResult(data);
        } catch {
            setEngineError(
                "Could not connect to Stockfish. Check that the Spring Boot backend is running.",
            );
        } finally {
            setIsAnalyzingPosition(false);
        }
    }

    if (gameId && isSavedReviewLoading) {
        return (
            <PageShell>
                <section className="review-page">
                    <div className="review-error-notice">
                        <span>⌛</span>
                        Loading saved analysis...
                    </div>
                </section>
            </PageShell>
        );
    }

    if (gameId && savedReviewError) {
        return (
            <PageShell>
                <section className="review-page">
                    <button
                        className="review-back-button"
                        type="button"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Back to dashboard
                    </button>

                    <div className="review-error-notice">
                        <span>!</span>
                        {savedReviewError}
                    </div>
                </section>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <section className="review-page">
                <header className="review-header">
                    <div>
                        <button
                            className="review-back-button"
                            type="button"
                            onClick={() => navigate(gameId ? "/dashboard" : "/analyze")}
                        >
                            {gameId ? "← Back to dashboard" : "← Back to import"}
                        </button>

                        <p className="dashboard-date">GAME REVIEW</p>

                        <h1>
                            {whitePlayer} <span>vs</span> {blackPlayer}
                        </h1>

                        <p className="review-header-description">
                            {eventName} · {moves.length} half-moves · Result: {gameResult}
                        </p>
                    </div>

                    <div className="review-status-group">
                        {usingDemoGame && (
                            <span className="review-demo-badge">Demo game</span>
                        )}

                        {fullGameAnalysis?.available ? (
                            <span className="review-complete-badge">
                                <span>✓</span>
                                Full analysis complete
                              </span>
                        ) : (
                            <span className="review-pending-badge">
                                <span />
                                Engine review pending
                              </span>
                        )}
                    </div>
                </header>

                {parseError && (
                    <div className="review-error-notice">
                        <span>!</span>
                        {parseError}
                    </div>
                )}
                {fullGameAnalysis?.available && (
                    <section className="review-analysis-summary">
                        <article className="review-summary-card review-summary-card-white">
                            <span className="review-summary-label">White accuracy</span>

                            <strong>{formatAccuracy(whiteSummary?.accuracy)}</strong>

                            <p>
                                {whitePlayer} · {formatAverageCpl(whiteSummary?.averageCentipawnLoss)}
                            </p>
                        </article>

                        <article className="review-summary-card review-summary-card-black">
                            <span className="review-summary-label">Black accuracy</span>

                            <strong>{formatAccuracy(blackSummary?.accuracy)}</strong>

                            <p>
                                {blackPlayer} · {formatAverageCpl(blackSummary?.averageCentipawnLoss)}
                            </p>
                        </article>

                        <article className="review-summary-card">
                            <span className="review-summary-label">Best moves</span>

                            <strong>{totalBestMoves}</strong>

                            <p>Across both players</p>
                        </article>

                        <article className="review-summary-card review-summary-card-critical">
                            <span className="review-summary-label">Critical errors</span>

                            <strong>{totalMistakes + totalBlunders}</strong>

                            <p>
                                {totalBlunders} blunders · {totalMistakes} mistakes
                            </p>
                        </article>
                    </section>
                )}

                {fullGameAnalysis?.available && (
                    <p className="review-accuracy-note">
                        ChessVision Accuracy is an engine-based score calculated from average
                        centipawn loss and critical errors.
                    </p>
                )}

                <section className="review-layout">
                    <article className="review-board-panel">
                        <div className="review-panel-heading">
                            <div>
                                <p className="panel-kicker">Interactive board</p>
                                <h2>
                                    {shouldShowRecommendation
                                        ? `Best move before ${currentMoveLabel}`
                                        : currentMoveLabel}
                                </h2>
                            </div>

                            <div className="review-board-toolbar">
                                {selectedMoveAnalysis && (
                                    <button
                                        className={`review-recommendation-button ${
                                            shouldShowRecommendation
                                                ? "review-recommendation-active"
                                                : ""
                                        }`}
                                        type="button"
                                        onClick={() => setShowBestMoveArrow((previous) => !previous)}
                                    >
                                        {shouldShowRecommendation ? "✦ Best move shown" : "Show best move"}
                                    </button>
                                )}

                                <button
                                    className="review-flip-button"
                                    type="button"
                                    onClick={flipBoard}
                                >
                                    ↻ Flip board
                                </button>
                            </div>
                        </div>

                        <div className="review-board-area">
                            <div className="evaluation-bar-column">
                                <div
                                    className="evaluation-bar"
                                    style={{
                                        "--white-evaluation": `${whiteEvaluationPercentage}%`,
                                    }}
                                    role="img"
                                    aria-label={`Engine evaluation ${evaluationBarScore}. ${evaluationDescription}.`}
                                    title={`${evaluationBarScore} — ${evaluationDescription}`}
                                >
                                    <div className="evaluation-bar-black"/>
                                    <div className="evaluation-bar-white"/>
                                </div>

                                <span className="evaluation-score-badge">
                                  {evaluationBarScore}
                                </span>
                            </div>

                            <div className="review-board-frame">
                                <Chessboard options={chessboardOptions}/>
                            </div>
                        </div>
                        {shouldShowRecommendation && (
                            <div className="review-recommendation-note">
                                <span className="review-recommendation-note-icon">↗</span>

                                <p>
                                    <strong>
                                        Stockfish recommends{" "}
                                        {formatUciMoveAsSan(
                                            recommendedMoveUci,
                                            selectedMoveAnalysis.fenBefore,
                                        )}
                                    </strong>
                                    {" instead of "}
                                    <strong>{currentMove?.san}</strong>.
                                </p>
                            </div>
                        )}

                        <div className="review-board-controls">
                            <button
                                type="button"
                                onClick={goToStart}
                                disabled={currentPly === 0}
                                aria-label="Go to first move"
                            >
                                |◀
                            </button>

                            <button
                                type="button"
                                onClick={goToPreviousMove}
                                disabled={currentPly === 0}
                                aria-label="Previous move"
                            >
                                ◀
                            </button>

                            <div className="review-current-move">
                                <span>Current position</span>
                                <strong>
                                    {currentPly} / {moves.length}
                                </strong>
                            </div>

                            <button
                                type="button"
                                onClick={goToNextMove}
                                disabled={currentPly === moves.length}
                                aria-label="Next move"
                            >
                                ▶
                            </button>

                            <button
                                type="button"
                                onClick={goToEnd}
                                disabled={currentPly === moves.length}
                                aria-label="Go to last move"
                            >
                                ▶|
                            </button>
                        </div>
                    </article>

                    <aside className="review-side-panel">
                        <article className="review-move-list-card">
                            <div className="review-panel-heading">
                                <div>
                                    <p className="panel-kicker">Move history</p>
                                    <h2>Game moves</h2>
                                </div>

                                <span className="review-move-count">
                  {Math.ceil(moves.length / 2)} moves
                </span>
                            </div>

                            <div className="review-move-list">
                                {movePairs.map((pair) => {
                                    const whiteAnalysis = analysisByPly.get(pair.whitePly);
                                    const blackAnalysis = pair.blackMove
                                        ? analysisByPly.get(pair.blackPly)
                                        : null;

                                    return (
                                        <div className="review-move-row" key={pair.moveNumber}>
                                            <span className="review-move-number">
                                              {pair.moveNumber}.
                                            </span>

                                            <button
                                                className={`review-move-button ${
                                                    currentPly === pair.whitePly ? "review-move-active" : ""
                                                } ${getMoveQualityClass(whiteAnalysis?.classification)}`}
                                                type="button"
                                                onClick={() => setCurrentPly(pair.whitePly)}
                                            >
                                                <span>{pair.whiteMove.san}</span>

                                                {whiteAnalysis && (
                                                    <i
                                                        className="review-move-quality-dot"
                                                        aria-label={whiteAnalysis.classification}
                                                    />
                                                )}
                                            </button>

                                            {pair.blackMove ? (
                                                <button
                                                    className={`review-move-button ${
                                                        currentPly === pair.blackPly ? "review-move-active" : ""
                                                    } ${getMoveQualityClass(blackAnalysis?.classification)}`}
                                                    type="button"
                                                    onClick={() => setCurrentPly(pair.blackPly)}
                                                >
                                                    <span>{pair.blackMove.san}</span>

                                                    {blackAnalysis && (
                                                        <i
                                                            className="review-move-quality-dot"
                                                            aria-label={blackAnalysis.classification}
                                                        />
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="review-empty-move">—</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </article>

                        <article className="review-inspection-card">
                            <div className="review-inspection-icon">⌁</div>

                            <p className="panel-kicker">Move inspection</p>

                            <h2>
                                {currentMove
                                    ? `${currentMoveLabel} was played.`
                                    : "Analyze the starting position."}
                            </h2>

                            <p>
                                Select any move to see what Stockfish recommended and how much the played
                                move changed the position.
                            </p>

                            <div className="review-inspection-grid">
                                <div>
                                    <span>Played move</span>
                                    <strong>{currentMove ? currentMove.san : "Starting position"}</strong>
                                </div>

                                <div>
                                    <span>Analysis depth</span>
                                    <strong>{requestedDepth}</strong>
                                </div>
                            </div>

                            {selectedMoveAnalysis && (
                                <div className="review-full-analysis-result">
                                    <div className="review-classification-heading">
        <span
            className={`review-classification-badge ${getMoveQualityClass(
                selectedMoveAnalysis.classification,
            )}`}
        >
          {selectedMoveAnalysis.classification}
        </span>

                                        <small>{selectedMoveAnalysis.centipawnLoss} cp loss</small>
                                    </div>

                                    <div className="engine-result-main">
                                        <div>
                                            <span>Best move</span>
                                            <strong>
                                                {formatUciMoveAsSan(
                                                    selectedMoveAnalysis.bestMoveUci,
                                                    selectedMoveAnalysis.fenBefore,
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Evaluation after</span>
                                            <strong className="engine-score">
                                                {formatWhiteEvaluation(
                                                    selectedMoveAnalysis.evaluationAfterWhiteCp,
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="review-evaluation-shift">
                                        <div>
                                            <span>Before move</span>
                                            <strong>
                                                {formatWhiteEvaluation(
                                                    selectedMoveAnalysis.evaluationBeforeWhiteCp,
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>After move</span>
                                            <strong>
                                                {formatWhiteEvaluation(
                                                    selectedMoveAnalysis.evaluationAfterWhiteCp,
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="engine-variation">
                                        <span>Principal variation</span>
                                        <code>
                                            {selectedMoveAnalysis.principalVariation || "Not available"}
                                        </code>
                                    </div>

                                    {selectedMoveFeedback && (
                                        <div
                                            className={`review-feedback-card ${
                                                selectedMoveFeedback.critical
                                                    ? "review-feedback-critical"
                                                    : ""
                                            }`}
                                        >
                                            <div className="review-feedback-top">
                                              <span className="review-feedback-icon">
                                                {selectedMoveFeedback.critical ? "!" : "✦"}
                                              </span>

                                                <strong>{selectedMoveFeedback.title}</strong>
                                            </div>

                                            <p>{selectedMoveFeedback.text}</p>

                                            <div className="review-feedback-detail">
                                                {selectedMoveFeedback.detail}
                                            </div>

                                            {detectedReasons.map((reason) => (
                                                <div
                                                    className="review-reason-card"
                                                    key={`${reason.title}-${selectedMoveAnalysis.ply}`}
                                                >
                                                    <div className="review-reason-header">
                                                      <span className="review-reason-icon">
                                                        {reason.icon || "♟"}
                                                      </span>

                                                        <strong>{reason.title}</strong>
                                                    </div>

                                                    <p>{reason.text}</p>

                                                    <div className="review-reason-detail">
                                                        {reason.detail}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    )}

                                </div>
                            )}

                            <button
                                className="review-analyze-button"
                                type="button"
                                onClick={analyzeCurrentPosition}
                                disabled={isAnalyzingPosition}
                            >
                                {isAnalyzingPosition ? (
                                    <>
                                        <span className="button-spinner"/>
                                        Analyzing position...
                                    </>
                                ) : (
                                    <>
                                        Reanalyze this position
                                        <span>→</span>
                                    </>
                                )}
                            </button>

                            {engineError && (
                                <div className="review-engine-error">
                                    <span>!</span>
                                    {engineError}
                                </div>
                            )}

                            {engineResult && (
                                <div className="review-engine-result">
                                    <div className="engine-result-heading">
                                        <span>Live Stockfish result</span>
                                        <small>Depth {engineResult.depth}</small>
                                    </div>

                                    <div className="engine-result-main">
                                        <div>
                                            <span>Best move</span>
                                            <strong>{formatBestMove(engineResult.bestMove)}</strong>
                                        </div>

                                        <div>
                                            <span>Evaluation</span>
                                            <strong className="engine-score">
                                                {formatEngineScore(engineResult)}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="engine-variation">
                                        <span>Principal variation</span>
                                        <code>{engineResult.principalVariation || "Not available"}</code>
                                    </div>
                                </div>
                            )}
                        </article>
                    </aside>
                </section>
            </section>
        </PageShell>
    );
}

export default ReviewGamePage;