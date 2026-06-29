import { Link } from "react-router";

const boardSquares = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    return {
        id: index,
        isLight: (row + col) % 2 === 0,
        piece:
            index === 4
                ? "♚"
                : index === 11
                    ? "♟"
                    : index === 18
                        ? "♞"
                        : index === 27
                            ? "♙"
                            : index === 36
                                ? "♘"
                                : index === 52
                                    ? "♕"
                                    : index === 60
                                        ? "♔"
                                        : "",
    };
});

function AuthLayout({ children }) {
    return (
        <main className="auth-page">
            <section className="auth-visual-section">
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

                    <div className="auth-mini-board">
                        {boardSquares.map((square) => (
                            <div
                                className={`auth-square ${
                                    square.isLight ? "auth-light" : "auth-dark"
                                }`}
                                key={square.id}
                            >
                                {square.piece}
                            </div>
                        ))}
                    </div>

                    <div className="auth-engine-card">
                        <span>Engine evaluation</span>
                        <strong>+1.62</strong>
                        <p>White has a strong attack</p>
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