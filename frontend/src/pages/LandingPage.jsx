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
                            <span className="status-dot" />
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
                        <div className="glow glow-one" />
                        <div className="glow glow-two" />

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
            </main>
        </div>
    );
}

export default LandingPage;