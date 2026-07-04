import { useEffect,useMemo, useState } from "react";
import { Link } from "react-router";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const HERO_PGN = `[Event "ChessVision Live Demo"]
[Site "ChessVision"]
[Date "2026.07.04"]
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

const HERO_ANALYSIS_STEPS = [
    {
        evaluation: "+0.18",
        verdict: "Position is balanced",
        bestMove: "1. e4",
        detail: "A principled central move.",
    },
    {
        evaluation: "+0.24",
        verdict: "White gains space",
        bestMove: "3. d4!",
        detail: "Challenge Black's center immediately.",
    },
    {
        evaluation: "+0.13",
        verdict: "Dynamic equality",
        bestMove: "5. Nc3",
        detail: "Natural development keeps every option open.",
    },
    {
        evaluation: "+0.36",
        verdict: "White keeps initiative",
        bestMove: "7. Nb3",
        detail: "The knight avoids exchanges and keeps pressure.",
    },
    {
        evaluation: "+0.42",
        verdict: "White is slightly better",
        bestMove: "9. Qd2",
        detail: "Connect the pieces and prepare long castling.",
    },
    {
        evaluation: "+0.31",
        verdict: "Sharp Sicilian position",
        bestMove: "10. O-O-O",
        detail: "Both sides are ready for a kingside race.",
    },
];

function getHeroInsight(currentPly) {
    const stepIndex = Math.min(
        Math.floor(currentPly / 4),
        HERO_ANALYSIS_STEPS.length - 1,
    );

    return HERO_ANALYSIS_STEPS[stepIndex];
}



function LandingPage() {
    const heroMoves = useMemo(() => {
        const game = new Chess();

        game.loadPgn(HERO_PGN);

        return game.history({ verbose: true });
    }, []);

    const [currentHeroPly, setCurrentHeroPly] = useState(0);

    const currentHeroMove =
        currentHeroPly > 0
            ? heroMoves[currentHeroPly - 1]
            : null;

    const heroBoardPosition =
        currentHeroMove?.after ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    const heroInsight = getHeroInsight(currentHeroPly);

    const heroMoveLabel = currentHeroMove
        ? `${Math.ceil(currentHeroPly / 2)}${
            currentHeroMove.color === "w" ? "." : "..."
        } ${currentHeroMove.san}`
        : "Starting position";

    const heroSquareStyles = currentHeroMove
        ? {
            [currentHeroMove.from]: {
                background:
                    "radial-gradient(circle, rgba(250, 204, 21, 0.56) 0%, rgba(250, 204, 21, 0.16) 65%, transparent 67%)",
            },

            [currentHeroMove.to]: {
                background:
                    "radial-gradient(circle, rgba(74, 222, 128, 0.62) 0%, rgba(74, 222, 128, 0.18) 65%, transparent 67%)",
            },
        }
        : {};

    const heroBoardOptions = {
        id: "chessvision-landing-board",
        position: heroBoardPosition,
        allowDragging: false,
        showNotation: true,
        showAnimations: true,
        animationDurationInMs: 260,
        squareStyles: heroSquareStyles,
        darkSquareStyle: {
            backgroundColor: "#3d6f4e",
        },
        lightSquareStyle: {
            backgroundColor: "#d9e7da",
        },
    };

    function goToPreviousHeroMove() {
        setCurrentHeroPly((current) => Math.max(0, current - 1));
    }

    function goToNextHeroMove() {
        setCurrentHeroPly((current) =>
            Math.min(heroMoves.length, current + 1),
        );
    }

    useEffect(() => {
        const revealTargets = Array.from(
            document.querySelectorAll(
                [
                    ".landing-3d .stats-section .stat-card",
                    ".landing-3d .features-section .section-heading",
                    ".landing-3d .feature-card",
                    ".landing-3d .how-it-works-section .section-heading",
                    ".landing-3d .workflow-step-card",
                    ".landing-3d .workflow-cta",
                    ".landing-3d .landing-insights-copy",
                    ".landing-3d .landing-insights-preview",
                ].join(", "),
            ),
        );

        revealTargets.forEach((element, index) => {
            element.classList.add("scroll-reveal");
            element.style.setProperty(
                "--scroll-reveal-delay",
                `${(index % 4) * 110}ms`,
            );
        });

        if (!("IntersectionObserver" in window)) {
            revealTargets.forEach((element) => {
                element.classList.add("is-visible");
            });

            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.16,
                rootMargin: "0px 0px -8% 0px",
            },
        );

        revealTargets.forEach((element) => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);


    return (
        <div className="app landing-3d">
            <header className="navbar">
                <div className="navbar-inner">
                    <a className="logo" href="#home">
                        <span className="logo-mark">♞</span>
                        Chess<span>Vision</span>
                    </a>

                    <nav className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#insights">Insights</a>
                    </nav>

                    <div className="nav-actions">
                        <Link className="login-button" to="/login">
                            Log in
                        </Link>

                        <Link className="primary-button small-button" to="/register">
                            Get started
                        </Link>
                    </div>
                </div>
            </header>
            <main id="home">
                <section className="hero-section">
                    <div className="hero-content">
                        <p className="eyebrow">
                            <span className="status-dot"/>
                            Smarter chess analysis
                        </p>

                        <h1>
                            See every move
                            <span> differently.</span>
                        </h1>

                        <p className="hero-description">
                            Import your games, discover critical mistakes, and understand the
                            best continuation with engine-powered analysis built for real
                            improvement.
                        </p>

                        <div className="hero-actions">
                            <Link className="primary-button" to="/analyze">
                                Analyze a game
                            </Link>

                            <a className="secondary-button" href="#features">
                                Explore features
                            </a>
                        </div>

                        <div className="hero-proof">
                            <div className="avatars">
                                <span>♟</span>
                                <span>♜</span>
                                <span>♝</span>
                            </div>

                            <p>
                                Built for players who want to <strong>improve faster.</strong>
                            </p>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="glow glow-one"/>
                        <div className="glow glow-two"/>

                        <div className="analysis-card floating-card top-card">
                            <p>Engine evaluation</p>
                            <strong>{heroInsight.evaluation}</strong>
                            <span>{heroInsight.verdict}</span>
                        </div>

                        <div className="board-wrapper hero-board-wrapper">
                            <div className="board-header">
                                <span>Live analysis board</span>

                                <span className="live-label">
                <i/>
                LIVE DEMO
            </span>
                            </div>

                            <div className="hero-live-board">
                                <Chessboard options={heroBoardOptions}/>
                            </div>

                            <div className="hero-board-controls">
                                <button
                                    className="hero-board-nav-button"
                                    type="button"
                                    onClick={goToPreviousHeroMove}
                                    disabled={currentHeroPly === 0}
                                    aria-label="Previous move"
                                >
                                    ←
                                </button>

                                <div className="hero-move-state">
                                    <span>{heroMoveLabel}</span>

                                    <strong>
                                        Move {currentHeroPly} / {heroMoves.length}
                                    </strong>
                                </div>

                                <button
                                    className="hero-board-nav-button"
                                    type="button"
                                    onClick={goToNextHeroMove}
                                    disabled={currentHeroPly === heroMoves.length}
                                    aria-label="Next move"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div className="analysis-card floating-card bottom-card">
                            <p>Stockfish suggestion</p>
                            <strong>{heroInsight.bestMove}</strong>
                            <span>{heroInsight.detail}</span>
                        </div>
                    </div>
                </section>

                <section className="stats-section">
                    <div className="stat-card">
                        <strong>Stockfish</strong>
                        <span>Engine-powered evaluation</span>
                    </div>

                    <div className="stat-card">
                        <strong>PGN Import</strong>
                        <span>Lichess, Chess.com and files</span>
                    </div>

                    <div className="stat-card">
                        <strong>Interactive</strong>
                        <span>Explore every position</span>
                    </div>

                    <div className="stat-card">
                        <strong>Personal</strong>
                        <span>Accuracy and improvement trends</span>
                    </div>
                </section>

                <section className="features-section" id="features">
                    <div className="section-heading">
                        <p className="eyebrow">Everything you need</p>
                        <h2>Turn every game into a lesson.</h2>
                        <p>
                            ChessVision combines powerful engine analysis with clear,
                            understandable feedback.
                        </p>
                    </div>

                    <div className="feature-grid">
                        <article className="feature-card">
                            <div className="feature-icon">⌁</div>
                            <h3>Engine analysis</h3>
                            <p>
                                Find best moves, tactical opportunities, inaccuracies, mistakes
                                and blunders in every game.
                            </p>
                        </article>

                        <article className="feature-card">
                            <div className="feature-icon">◫</div>
                            <h3>Interactive board</h3>
                            <p>
                                Replay your game move by move, view recommended lines, and
                                explore alternative positions.
                            </p>
                        </article>

                        <article className="feature-card">
                            <div className="feature-icon">↗</div>
                            <h3>Personal insights</h3>
                            <p>
                                Track accuracy, blunder frequency, openings, performance trends,
                                and estimated playing strength.
                            </p>
                        </article>
                    </div>
                </section>
                <section className="how-it-works-section" id="how-it-works">
                    <div className="section-heading">
                        <p className="eyebrow">Simple workflow</p>
                        <h2>From game to lesson in three steps.</h2>
                        <p>
                            ChessVision keeps the analysis process simple: bring your
                            game, let Stockfish inspect it, then revisit the moments
                            that matter most.
                        </p>
                    </div>

                    <div className="how-it-works-grid">
                        <article className="workflow-step-card">
                            <span className="workflow-step-number">01</span>

                            <div className="workflow-step-icon">⌕</div>

                            <h3>Import your game</h3>

                            <p>
                                Paste a PGN, upload a PGN file, or import a public
                                game from Lichess or Chess.com.
                            </p>

                            <span className="workflow-step-label">
                                PGN · File · Links
                            </span>
                        </article>

                        <article className="workflow-step-card workflow-step-featured">
                            <span className="workflow-step-number">02</span>

                            <div className="workflow-step-icon">♞</div>

                            <h3>Run Stockfish analysis</h3>

                            <p>
                                Choose Quick, Standard, or Deep analysis and let
                                ChessVision evaluate every move in your game.
                            </p>

                            <span className="workflow-step-label">
                                Best moves · CPL · Accuracy
                            </span>
                        </article>

                        <article className="workflow-step-card">
                            <span className="workflow-step-number">03</span>

                            <div className="workflow-step-icon">↗</div>

                            <h3>Review and improve</h3>

                            <p>
                                Replay the game, see recommended moves, inspect
                                mistakes, and return to any saved analysis later.
                            </p>

                            <span className="workflow-step-label">
                                Review · History · Progress
                            </span>
                        </article>
                    </div>

                    <div className="workflow-cta">
                        <div>
                            <strong>Ready to review your next game?</strong>
                            <span>
                                Your saved analyses appear in Dashboard and My Games.
                            </span>
                        </div>

                        <Link className="primary-button small-button" to="/analyze">
                            Analyze a game
                        </Link>
                    </div>
                </section>

                <section className="landing-insights-section" id="insights">
                    <div className="landing-insights-copy">
                        <p className="eyebrow">Personal improvement</p>

                        <h2>See patterns, not only moves.</h2>

                        <p>
                            Every saved analysis contributes to your personal
                            dashboard. Follow accuracy over time, see where
                            blunders happen, and identify the phase of the game
                            that needs more attention.
                        </p>

                        <div className="landing-insight-list">
                            <div>
                                <span className="landing-insight-check">✓</span>

                                <p>
                                    <strong>Accuracy trend</strong>
                                    Compare your recent games and follow your
                                    engine-based accuracy over time.
                                </p>
                            </div>

                            <div>
                                <span className="landing-insight-check">✓</span>

                                <p>
                                    <strong>Focus area detection</strong>
                                    Find whether opening, middlegame, or endgame
                                    decisions cost you the most value.
                                </p>
                            </div>

                            <div>
                                <span className="landing-insight-check">✓</span>

                                <p>
                                    <strong>Saved game library</strong>
                                    Search, filter, and reopen every completed
                                    analysis whenever you need it.
                                </p>
                            </div>
                        </div>

                        <Link className="secondary-button" to="/games">
                            Explore My Games
                        </Link>
                    </div>

                    <div className="landing-insights-preview">
                        <div className="insights-preview-top">
                            <div>
                                <span>Personal dashboard</span>
                                <strong>Recent performance</strong>
                            </div>

                            <span className="insights-preview-live">
                                <i/>
                                LIVE DATA
                            </span>
                        </div>

                        <div className="insights-preview-stats">
                            <article>
                                <span>Average accuracy</span>
                                <strong>78.6%</strong>
                                <small>Across saved analyses</small>
                            </article>

                            <article>
                                <span>Focus area</span>
                                <strong>Middlegame</strong>
                                <small>Candidate move calculation</small>
                            </article>
                        </div>

                        <div className="insights-preview-chart">
                            <div className="insights-chart-heading">
                                <span>Accuracy over time</span>
                                <strong>Last 8 games</strong>
                            </div>

                            <div className="insights-chart-bars">
                                {[48, 59, 54, 68, 65, 79, 74, 86].map(
                                    (height, index) => (
                                        <span
                                            key={index}
                                            className={
                                                index === 7
                                                    ? "insights-chart-bar insights-chart-bar-latest"
                                                    : "insights-chart-bar"
                                            }
                                            style={{height: `${height}%`}}
                                        />
                                    ),
                                )}
                            </div>

                            <div className="insights-chart-labels">
                                <span>First analysis</span>
                                <span>Latest game</span>
                            </div>
                        </div>

                        <div className="insights-preview-footer">
                            <span className="insights-preview-arrow">↗</span>

                            <p>
                                <strong>Progress comes from review.</strong>
                                Your next analysis can reveal the next improvement.
                            </p>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );


}


export default LandingPage;