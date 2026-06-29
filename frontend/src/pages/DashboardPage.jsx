import { useEffect, useState } from "react";
import { Link } from "react-router";
import AppShell from "../components/layout/AppShell";

const recentGames = [
    {
        id: 1,
        opponent: "TacticalWolf",
        color: "Black",
        result: "Loss",
        accuracy: "71.4%",
        blunders: 4,
        date: "Today",
    },
    {
        id: 2,
        opponent: "KnightRider",
        color: "White",
        result: "Win",
        accuracy: "86.2%",
        blunders: 1,
        date: "Yesterday",
    },
    {
        id: 3,
        opponent: "QuietStorm",
        color: "Black",
        result: "Draw",
        accuracy: "79.8%",
        blunders: 2,
        date: "Jun 26",
    },
];

const accuracyBars = [48, 62, 55, 74, 68, 86, 77, 90, 83, 91, 87, 94];

function DashboardPage() {
    const [backendStatus, setBackendStatus] = useState(
        "Checking backend connection...",
    );

    const [backendOnline, setBackendOnline] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function checkBackend() {
            try {
                const response = await fetch("http://localhost:8080/api/health", {
                    signal: controller.signal,
                });

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

    return (
        <AppShell>
            <section className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <p className="dashboard-date">MONDAY, JUNE 29</p>
                        <h1>
                            Welcome back, <span>Martin.</span>
                        </h1>
                        <p>
                            Your next game could teach you something important. Ready to
                            analyze?
                        </p>
                    </div>

                    <div className="dashboard-header-actions">
                        <div
                            className={`backend-connection-status ${
                                backendOnline ? "backend-online" : "backend-offline"
                            }`}
                        >
                            <span/>
                            {backendStatus}
                        </div>

                        <Link className="dashboard-primary-button" to="/analyze">
                            <span>+</span>
                            Analyze New Game
                        </Link>
                    </div>
                </header>

                <section className="dashboard-overview-grid">
                    <article className="overview-card overview-card-highlight">
                        <div className="overview-card-top">
                            <span className="overview-icon">♞</span>
                            <span className="overview-chip">This month</span>
                        </div>

                        <p className="overview-label">Games analyzed</p>
                        <strong className="overview-value">12</strong>

                        <div className="overview-footer">
                            <span className="positive-change">↑ 4</span>
                            <span>compared to last month</span>
                        </div>
                    </article>

                    <article className="overview-card">
                        <div className="overview-card-top">
                            <span className="overview-icon">◎</span>
                            <span className="overview-card-status">Improving</span>
                        </div>

                        <p className="overview-label">Average accuracy</p>
                        <strong className="overview-value">78.6%</strong>

                        <div className="overview-footer">
                            <span className="positive-change">↑ 3.8%</span>
                            <span>over your previous 10 games</span>
                        </div>
                    </article>

                    <article className="overview-card">
                        <div className="overview-card-top">
                            <span className="overview-icon">!</span>
                            <span className="overview-card-status">Focus area</span>
                        </div>

                        <p className="overview-label">Average blunders</p>
                        <strong className="overview-value">2.4</strong>

                        <div className="overview-footer">
                            <span className="positive-change">↓ 0.8</span>
                            <span>fewer errors per game</span>
                        </div>
                    </article>

                    <article className="overview-card">
                        <div className="overview-card-top">
                            <span className="overview-icon">↗</span>
                            <span className="overview-card-status">One game estimate</span>
                        </div>

                        <p className="overview-label">Performance range</p>
                        <strong className="overview-value overview-value-rating">
                            1450<span>–</span>1650
                        </strong>

                        <div className="overview-footer">
                            <span>Based on your latest analysis</span>
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
                                Last 12 games <span>⌄</span>
                            </button>
                        </div>

                        <div className="chart-summary">
                            <div>
                                <strong>78.6%</strong>
                                <span>Average accuracy</span>
                            </div>

                            <div className="chart-summary-badge">
                                <span>↑</span>
                                +8.4% trend
                            </div>
                        </div>

                        <div className="accuracy-chart" aria-label="Accuracy chart">
                            {accuracyBars.map((height, index) => (
                                <div className="chart-bar-wrapper" key={index}>
                                    <div
                                        className={`chart-bar ${
                                            index === accuracyBars.length - 1
                                                ? "chart-bar-latest"
                                                : ""
                                        }`}
                                        style={{ height: `${height}%` }}
                                    />
                                </div>
                            ))}
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

                            <span className="insight-badge">Middlegame</span>
                        </div>

                        <div className="improvement-score">
                            <div className="score-ring">
                                <span>68</span>
                            </div>

                            <div>
                                <strong>Position conversion</strong>
                                <p>
                                    You often reach playable positions but lose accuracy during
                                    tactical middlegame moments.
                                </p>
                            </div>
                        </div>

                        <div className="improvement-list">
                            <div>
                                <span className="improvement-marker marker-good" />
                                <p>
                                    <strong>Strongest phase</strong>
                                    Opening development
                                </p>
                            </div>

                            <div>
                                <span className="improvement-marker marker-warning" />
                                <p>
                                    <strong>Practice next</strong>
                                    Candidate move calculation
                                </p>
                            </div>

                            <div>
                                <span className="improvement-marker marker-info" />
                                <p>
                                    <strong>Suggested goal</strong>
                                    Keep blunders below 2 per game
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

                        <button className="panel-text-button" type="button">
                            View all games <span>→</span>
                        </button>
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
                            {recentGames.map((game) => (
                                <tr key={game.id}>
                                    <td>
                                        <div className="opponent-cell">
                        <span className="opponent-avatar">
                          {game.opponent.charAt(0)}
                        </span>
                                            <strong>{game.opponent}</strong>
                                        </div>
                                    </td>

                                    <td>
                      <span
                          className={`color-indicator ${
                              game.color === "White"
                                  ? "color-indicator-white"
                                  : "color-indicator-black"
                          }`}
                      />
                                        {game.color}
                                    </td>

                                    <td>
                      <span
                          className={`result-badge result-${game.result.toLowerCase()}`}
                      >
                        {game.result}
                      </span>
                                    </td>

                                    <td className="accuracy-cell">{game.accuracy}</td>
                                    <td>{game.blunders}</td>
                                    <td className="date-cell">{game.date}</td>

                                    <td>
                                        <button
                                            className="table-action-button"
                                            type="button"
                                            aria-label={`View ${game.opponent} game`}
                                        >
                                            →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>
        </AppShell>
    );
}

export default DashboardPage;