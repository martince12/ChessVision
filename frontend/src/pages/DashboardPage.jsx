import { useEffect, useState } from "react";
import { Link,useNavigate  } from "react-router";
import AppShell from "../components/layout/AppShell";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";


function formatAccuracy(value) {
    if (typeof value !== "number") {
        return "—";
    }

    return `${value.toFixed(1)}%`;
}

function formatBlunders(value) {
    if (typeof value !== "number") {
        return "—";
    }

    return value.toFixed(1);
}

function formatDate(value) {
    if (!value) {
        return "Unknown date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year:
            date.getFullYear() !== new Date().getFullYear()
                ? "numeric"
                : undefined,
    }).format(date);
}

function getDashboardDate() {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    })
        .format(new Date())
        .toUpperCase();
}

function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [backendStatus, setBackendStatus] = useState(
        "Checking backend connection...",
    );
    const [backendOnline, setBackendOnline] = useState(false);

    const [dashboard, setDashboard] = useState(null);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState("");

    const displayName =
        user?.user_metadata?.display_name ||
        user?.user_metadata?.username ||
        user?.email?.split("@")[0] ||
        "Chess player";

    const recentGames = dashboard?.recentGames ?? [];
    const accuracyTrend = dashboard?.accuracyTrend ?? [];

    const chartBars =
        accuracyTrend.length > 0
            ? accuracyTrend
            : Array.from({ length: 12 }, () => 0);

    const latestAccuracy =
        accuracyTrend.length > 0
            ? accuracyTrend[accuracyTrend.length - 1]
            : null;

    const focusArea = dashboard?.focusArea;

    useEffect(() => {
        const controller = new AbortController();

        async function checkBackend() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/health`,
                    {
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error("Backend did not respond correctly.");
                }

                const data = await response.json();

                setBackendStatus(data.message);
                setBackendOnline(true);
            } catch {
                setBackendStatus("Backend is offline");
                setBackendOnline(false);
            }
        }

        checkBackend();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function loadDashboard() {
            setIsDashboardLoading(true);
            setDashboardError("");

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
                    `${API_BASE_URL}/api/dashboard`,
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
                        "ChessVision could not load your dashboard.",
                    );
                }

                setDashboard(data);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setDashboardError(
                        error.message ||
                        "Could not load your saved analyses.",
                    );
                }
            } finally {
                setIsDashboardLoading(false);
            }
        }

        loadDashboard();

        return () => controller.abort();
    }, []);

    return (
        <AppShell>
            <section className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <p className="dashboard-date">{getDashboardDate()}</p>

                        <h1>
                            Welcome back, <span>{displayName}.</span>
                        </h1>

                        <p>
                            Your next game could teach you something important. Ready to
                            analyze?
                        </p>
                    </div>

                    <div className="dashboard-header-actions">
                        <div
                            className={`backend-connection-status ${
                                backendOnline
                                    ? "backend-online"
                                    : "backend-offline"
                            }`}
                        >
                            <span />
                            {backendStatus}
                        </div>

                        <Link className="dashboard-primary-button" to="/analyze">
                            <span>+</span>
                            Analyze New Game
                        </Link>
                    </div>
                </header>

                {dashboardError && (
                    <p className="auth-message auth-message-error">
                        {dashboardError}
                    </p>
                )}

                <section className="dashboard-overview-grid">
                    <article className="overview-card overview-card-highlight">
                        <div className="overview-card-top">
                            <span className="overview-icon">♞</span>
                            <span className="overview-chip">All time</span>
                        </div>

                        <p className="overview-label">Games analyzed</p>

                        <strong className="overview-value">
                            {isDashboardLoading
                                ? "…"
                                : dashboard?.totalGames ?? 0}
                        </strong>

                        <div className="overview-footer">
                            <span>
                                {dashboard?.totalGames === 1
                                    ? "1 saved analysis"
                                    : `${dashboard?.totalGames ?? 0} saved analyses`}
                            </span>
                        </div>
                    </article>

                    <article className="overview-card">
                        <div className="overview-card-top">
                            <span className="overview-icon">◎</span>
                            <span className="overview-card-status">
                                Your average
                            </span>
                        </div>

                        <p className="overview-label">Average accuracy</p>

                        <strong className="overview-value">
                            {isDashboardLoading
                                ? "…"
                                : formatAccuracy(dashboard?.averageAccuracy)}
                        </strong>

                        <div className="overview-footer">
                            <span>Across all saved analyses</span>
                        </div>
                    </article>

                    <article className="overview-card">
                        <div className="overview-card-top">
                            <span className="overview-icon">!</span>
                            <span className="overview-card-status">Focus area</span>
                        </div>

                        <p className="overview-label">Average blunders</p>

                        <strong className="overview-value">
                            {isDashboardLoading
                                ? "…"
                                : formatBlunders(dashboard?.averageBlunders)}
                        </strong>

                        <div className="overview-footer">
                            <span>Per saved game</span>
                        </div>
                    </article>

                    <article className="overview-card">
                        <div className="overview-card-top">
                            <span className="overview-icon">↗</span>
                            <span className="overview-card-status">
                                Estimate
                            </span>
                        </div>

                        <p className="overview-label">Performance range</p>

                        <strong className="overview-value overview-value-rating">
                            {isDashboardLoading ? (
                                "…"
                            ) : dashboard?.performanceLower != null &&
                            dashboard?.performanceUpper != null ? (
                                <>
                                    {dashboard.performanceLower}
                                    <span>–</span>
                                    {dashboard.performanceUpper}
                                </>
                            ) : (
                                "—"
                            )}
                        </strong>

                        <div className="overview-footer">
                            <span>Based on saved analyses</span>
                        </div>
                    </article>
                </section>

                <section className="dashboard-grid">
                    <article className="dashboard-panel accuracy-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">Performance trend</p>
                                <h2>Accuracy over time</h2>
                            </div>

                            <button className="panel-select-button" type="button">
                                Last {Math.min(chartBars.length, 12)} games{" "}
                                <span>⌄</span>
                            </button>
                        </div>

                        <div className="chart-summary">
                            <div>
                                <strong>
                                    {formatAccuracy(dashboard?.averageAccuracy)}
                                </strong>
                                <span>Average accuracy</span>
                            </div>

                            <div className="chart-summary-badge">
                                <span>↗</span>
                                {latestAccuracy == null
                                    ? "No games yet"
                                    : `${formatAccuracy(latestAccuracy)} latest`}
                            </div>
                        </div>

                        <div className="accuracy-chart" aria-label="Accuracy chart">
                            {chartBars.map((accuracy, index) => {
                                const height =
                                    accuracy > 0
                                        ? Math.max(4, Math.min(100, accuracy))
                                        : 0;

                                return (
                                    <div
                                        className="chart-bar-wrapper"
                                        key={`${accuracy}-${index}`}
                                    >
                                        <div
                                            className={`chart-bar ${
                                                index === chartBars.length - 1 &&
                                                accuracy > 0
                                                    ? "chart-bar-latest"
                                                    : ""
                                            }`}
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="chart-labels">
                            <span>First analysis</span>
                            <span>Latest game</span>
                        </div>
                    </article>

                    <article className="dashboard-panel improvement-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">Personal insight</p>
                                <h2>Your focus area</h2>
                            </div>

                            <span className="insight-badge">
                                {focusArea?.phase ?? "No data"}
                            </span>
                        </div>

                        <div className="improvement-score">
                            <div className="score-ring">
                                <span>{focusArea?.score ?? 0}</span>
                            </div>

                            <div>
                                <strong>
                                    {focusArea?.phase
                                        ? `${focusArea.phase} decision making`
                                        : "Analyze a game to begin"}
                                </strong>

                                <p>
                                    {focusArea?.averageCentipawnLoss != null
                                        ? `You lose an average of ${focusArea.averageCentipawnLoss.toFixed(
                                            1,
                                        )} centipawns per move during this phase.`
                                        : "Your first completed analysis will reveal a personal focus area."}
                                </p>
                            </div>
                        </div>

                        <div className="improvement-list">
                            <div>
                                <span className="improvement-marker marker-good" />
                                <p>
                                    <strong>Strongest phase</strong>
                                    {focusArea?.strongestPhase ?? "No data yet"}
                                </p>
                            </div>

                            <div>
                                <span className="improvement-marker marker-warning" />
                                <p>
                                    <strong>Practice next</strong>
                                    {focusArea?.phase
                                        ? `${focusArea.phase} candidate moves`
                                        : "Analyze your first game"}
                                </p>
                            </div>

                            <div>
                                <span className="improvement-marker marker-info" />
                                <p>
                                    <strong>Suggested goal</strong>
                                    Keep blunders below{" "}
                                    {focusArea?.suggestedBlunderGoal ?? 2} per game
                                </p>
                            </div>
                        </div>

                        <Link className="panel-text-link" to="/analyze">
                            Analyze another game <span>→</span>
                        </Link>
                    </article>
                </section>

                <section className="dashboard-panel recent-games-panel">
                    <div className="panel-heading">
                        <div>
                            <p className="panel-kicker">Analysis history</p>
                            <h2>Recent games</h2>
                        </div>

                        <Link className="panel-text-button" to="/games">
                            View all games <span>→</span>
                        </Link>
                    </div>

                    <div className="recent-games-table-wrapper">
                        <table className="recent-games-table">
                            <thead>
                            <tr>
                                <th>Opponent</th>
                                <th>Played as</th>
                                <th>Result</th>
                                <th>Accuracy</th>
                                <th>Blunders</th>
                                <th>Date</th>
                                <th />
                            </tr>
                            </thead>

                            <tbody>
                            {isDashboardLoading ? (
                                <tr>
                                    <td colSpan="7">Loading your analyses…</td>
                                </tr>
                            ) : recentGames.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        No saved analyses yet. Analyze your first
                                        game to see it here.
                                    </td>
                                </tr>
                            ) : (
                                recentGames.map((game) => (
                                    <tr key={game.gameId}>
                                        <td>
                                            <div className="opponent-cell">
                                                    <span className="opponent-avatar">
                                                        {game.opponent
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ?? "?"}
                                                    </span>

                                                <strong>{game.opponent}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            {game.playedAs === "White" && (
                                                <span className="color-indicator color-indicator-white" />
                                            )}

                                            {game.playedAs === "Black" && (
                                                <span className="color-indicator color-indicator-black" />
                                            )}

                                            {game.playedAs}
                                        </td>

                                        <td>
                                                <span
                                                    className={`result-badge result-${game.result?.toLowerCase()}`}
                                                >
                                                    {game.result}
                                                </span>
                                        </td>

                                        <td className="accuracy-cell">
                                            {formatAccuracy(game.accuracy)}
                                        </td>

                                        <td>{game.blunders ?? 0}</td>

                                        <td className="date-cell">
                                            {formatDate(game.createdAt)}
                                        </td>

                                        <td>
                                            <button
                                                className="table-action-button"
                                                type="button"
                                                onClick={() => navigate(`/review/${game.gameId}`)}
                                                aria-label={`View ${game.opponent} game`}
                                            >
                                                →
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>
        </AppShell>
    );
}

export default DashboardPage;