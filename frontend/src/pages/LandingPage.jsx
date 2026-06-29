import { Link } from "react-router";

const boardSquares = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const isLight = (row + col) % 2 === 0;

    return {
        id: index,
        isLight,
        piece:
            index === 1
                ? "♞"
                : index === 3
                    ? "♛"
                    : index === 6
                        ? "♚"
                        : index === 12
                            ? "♙"
                            : index === 28
                                ? "♘"
                                : index === 36
                                    ? "♙"
                                    : "",
    };
});

function LandingPage() {
    return (
        <div className="app">
            <header className="navbar">
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
                            <strong>+1.84</strong>
                            <span>White is better</span>
                        </div>

                        <div className="board-wrapper">
                            <div className="board-header">
                                <span>Analysis board</span>
                                <span className="live-label">LIVE</span>
                            </div>

                            <div className="chess-board">
                                {boardSquares.map((square) => (
                                    <div
                                        key={square.id}
                                        className={`square ${square.isLight ? "light" : "dark"}`}
                                    >
                                        {square.piece}
                                    </div>
                                ))}
                            </div>

                            <div className="board-footer">
                                <div>
                                    <p>Best move</p>
                                    <strong>Nf5</strong>
                                </div>

                                <button className="play-button" aria-label="Play moves">
                                    ▶
                                </button>

                                <div className="move-info">
                                    <p>Move</p>
                                    <strong>18 / 46</strong>
                                </div>
                            </div>
                        </div>

                        <div className="analysis-card floating-card bottom-card">
                            <p>Critical moment</p>
                            <strong className="danger-text">23. Qd2</strong>
                            <span>Missed winning move</span>
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