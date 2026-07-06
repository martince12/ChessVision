import { Link } from "react-router";

function GuestAnalysisShell({ children }) {
    return (
        <div className="guest-analysis-shell">
            <header className="guest-analysis-navbar">
                <div className="guest-analysis-navbar-inner">
                    <Link className="guest-analysis-logo" to="/">
                        <span className="logo-mark">♞</span>
                        Chess<span>Vision</span>
                    </Link>

                    <div className="guest-analysis-actions">
                        <span className="guest-analysis-mode">
                            Guest analysis
                        </span>

                        <Link
                            className="guest-analysis-login"
                            to="/login"
                        >
                            Log in
                        </Link>

                        <Link
                            className="guest-analysis-register"
                            to="/register"
                        >
                            Create account
                        </Link>
                    </div>
                </div>
            </header>

            <main className="guest-analysis-main">{children}</main>
        </div>
    );
}

export default GuestAnalysisShell;