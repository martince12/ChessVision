import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const AUTH_DEMO_PGN = `[Event "ChessVision Auth Demo"]
[Site "ChessVision"]
[Date "2026.07.06"]
[Round "1"]
[White "ChessVision"]
[Black "Stockfish"]
[Result "*"]

1. e4 c5
2. Nf3 Nc6
3. d4 cxd4
4. Nxd4 Nf6
5. Nc3 d6
6. Be3 e5
7. Nb3 Be7
8. f3 O-O
9. Qd2 Be6
10. O-O-O a5 *`;

const AUTH_ANALYSIS_STEPS = [
    {
        evaluation: "+0.18",
        verdict: "Position is balanced",
        bestMove: "1. e4",
        detail: "A strong central move.",
    },
    {
        evaluation: "+0.24",
        verdict: "White gains space",
        bestMove: "3. d4!",
        detail: "Challenge Black's center.",
    },
    {
        evaluation: "+0.13",
        verdict: "Dynamic equality",
        bestMove: "5. Nc3",
        detail: "Natural development.",
    },
    {
        evaluation: "+0.36",
        verdict: "White keeps initiative",
        bestMove: "7. Nb3",
        detail: "Keep pressure on the position.",
    },
    {
        evaluation: "+0.42",
        verdict: "White is slightly better",
        bestMove: "9. Qd2",
        detail: "Prepare long castling.",
    },
    {
        evaluation: "+0.31",
        verdict: "Sharp Sicilian position",
        bestMove: "10. O-O-O",
        detail: "Both sides are ready to attack.",
    },
];

function getAuthInsight(currentPly) {
    const index = Math.min(
        Math.floor(currentPly / 4),
        AUTH_ANALYSIS_STEPS.length - 1,
    );

    return AUTH_ANALYSIS_STEPS[index];
}

function AuthLayout({ children }) {
    const authMoves = useMemo(() => {
        const game = new Chess();

        game.loadPgn(AUTH_DEMO_PGN);

        return game.history({ verbose: true });
    }, []);

    const [currentAuthPly, setCurrentAuthPly] = useState(0);

    const currentAuthMove =
        currentAuthPly > 0
            ? authMoves[currentAuthPly - 1]
            : null;

    const authBoardPosition =
        currentAuthMove?.after ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    const authInsight = getAuthInsight(currentAuthPly);

    const authMoveLabel = currentAuthMove
        ? `${Math.ceil(currentAuthPly / 2)}${
            currentAuthMove.color === "w" ? "." : "..."
        } ${currentAuthMove.san}`
        : "Starting position";

    const authSquareStyles = currentAuthMove
        ? {
            [currentAuthMove.from]: {
                background:
                    "radial-gradient(circle, rgba(250, 204, 21, 0.56) 0%, rgba(250, 204, 21, 0.16) 65%, transparent 67%)",
            },

            [currentAuthMove.to]: {
                background:
                    "radial-gradient(circle, rgba(74, 222, 128, 0.62) 0%, rgba(74, 222, 128, 0.18) 65%, transparent 67%)",
            },
        }
        : {};

    const authBoardOptions = {
        id: "chessvision-auth-board",
        position: authBoardPosition,
        allowDragging: false,
        showNotation: true,
        showAnimations: true,
        animationDurationInMs: 250,
        squareStyles: authSquareStyles,
        darkSquareStyle: {
            backgroundColor: "#3d6f4e",
        },
        lightSquareStyle: {
            backgroundColor: "#d9e7da",
        },
    };

    function goToPreviousAuthMove() {
        setCurrentAuthPly((current) => Math.max(0, current - 1));
    }

    function goToNextAuthMove() {
        setCurrentAuthPly((current) =>
            Math.min(authMoves.length, current + 1),
        );
    }

    return (
        <main className="auth-page auth-3d">
            <section className="auth-visual-section">
                <div className="auth-ambient-glow auth-ambient-glow-one" />
                <div className="auth-ambient-glow auth-ambient-glow-two" />

                <Link className="auth-logo" to="/">
                    <span className="logo-mark">♞</span>
                    Chess<span>Vision</span>
                </Link>

                <div className="auth-visual-content">
                    <p className="eyebrow">
                        <span className="status-dot" />
                        Analyze. Learn. Improve.
                    </p>

                    <h1>
                        Every game has
                        <span> a lesson.</span>
                    </h1>

                    <p>
                        See critical moments, understand your mistakes, and discover the
                        strongest continuation in every position.
                    </p>
                </div>

                <div className="auth-board-preview">
                    <div className="auth-board-glow" />

                    <div className="auth-engine-card auth-engine-card-top">
                        <span>Engine evaluation</span>
                        <strong>{authInsight.evaluation}</strong>
                        <p>{authInsight.verdict}</p>
                    </div>

                    <div className="auth-live-board-frame">
                        <div className="auth-board-header">
                            <span>Live analysis board</span>

                            <span className="auth-live-badge">
                                <i />
                                LIVE DEMO
                            </span>
                        </div>

                        <div className="auth-live-board">
                            <Chessboard options={authBoardOptions} />
                        </div>

                        <div className="auth-board-controls">
                            <button
                                className="auth-board-nav-button"
                                type="button"
                                onClick={goToPreviousAuthMove}
                                disabled={currentAuthPly === 0}
                                aria-label="Previous move"
                            >
                                ←
                            </button>

                            <div className="auth-move-state">
                                <span>{authMoveLabel}</span>

                                <strong>
                                    Move {currentAuthPly} / {authMoves.length}
                                </strong>
                            </div>

                            <button
                                className="auth-board-nav-button"
                                type="button"
                                onClick={goToNextAuthMove}
                                disabled={currentAuthPly === authMoves.length}
                                aria-label="Next move"
                            >
                                →
                            </button>
                        </div>
                    </div>

                    <div className="auth-engine-card auth-engine-card-bottom">
                        <span>Stockfish suggestion</span>
                        <strong>{authInsight.bestMove}</strong>
                        <p>{authInsight.detail}</p>
                    </div>
                </div>

                <p className="auth-footer-text">
                    Built for players who want to improve with every move.
                </p>
            </section>

            <section className="auth-form-section">
                <Link className="mobile-auth-logo" to="/">
                    <span className="logo-mark">♞</span>
                    Chess<span>Vision</span>
                </Link>

                <div className="auth-form-container">{children}</div>
            </section>
        </main>
    );
}

export default AuthLayout;