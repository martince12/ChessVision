import { useEffect, useState } from "react";
import { Link } from "react-router";
import AppShell from "../components/layout/AppShell";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";

function formatAccuracy(value) {
    if (typeof value !== "number") {
        return "—";
    }

    return `${value.toFixed(1)}%`;
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

function formatSource(source) {
    const sourceLabels = {
        pasted_pgn: "Pasted PGN",
        pgn_file: "PGN file",
        lichess: "Lichess",
        chesscom: "Chess.com",
        manual: "Manual board",
    };

    return sourceLabels[source] || "Imported game";
}

function formatMode(mode) {
    if (!mode) {
        return "Standard";
    }

    return `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}

function getResultInfo(result) {
    switch (result) {
        case "1-0":
            return {
                label: "White won",
                className: "game-history-result-white",
            };

        case "0-1":
            return {
                label: "Black won",
                className: "game-history-result-black",
            };

        case "1/2-1/2":
            return {
                label: "Draw",
                className: "game-history-result-draw",
            };

        default:
            return {
                label: "Unfinished",
                className: "game-history-result-unfinished",
            };
    }
}

function MyGamesPage() {
    const [history, setHistory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");

    const [page, setPage] = useState(1);
    const [sourceFilter, setSourceFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");

    const [searchDraft, setSearchDraft] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const games = history?.games ?? [];
    const totalGames = history?.totalGames ?? 0;
    const totalPages = history?.totalPages ?? 1;
    const currentPage = history?.page ?? page;

    const hasActiveFilters =
        sourceFilter !== "all" ||
        modeFilter !== "all" ||
        Boolean(searchQuery);

    useEffect(() => {
        const controller = new AbortController();

        async function loadGameHistory() {
            setIsLoading(true);
            setHistoryError("");

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

                const params = new URLSearchParams({
                    page: String(page),
                    pageSize: "10",
                });

                if (sourceFilter !== "all") {
                    params.set("source", sourceFilter);
                }

                if (modeFilter !== "all") {
                    params.set("mode", modeFilter);
                }

                if (searchQuery) {
                    params.set("search", searchQuery);
                }

                const response = await fetch(
                    `${API_BASE_URL}/api/games?${params.toString()}`,
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
                        "ChessVision could not load your game history.",
                    );
                }

                setHistory(data);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setHistoryError(
                        error.message ||
                        "Could not load your saved analyses.",
                    );
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadGameHistory();

        return () => controller.abort();
    }, [page, sourceFilter, modeFilter, searchQuery]);

    function handleSearchSubmit(event) {
        event.preventDefault();

        setPage(1);
        setSearchQuery(searchDraft.trim());
    }

    function clearFilters() {
        setPage(1);
        setSourceFilter("all");
        setModeFilter("all");
        setSearchDraft("");
        setSearchQuery("");
    }

    return (
        <AppShell>
            <section className="games-page">
                <header className="games-page-header">
                    <div>
                        <p className="dashboard-date">ANALYSIS LIBRARY</p>

                        <h1>
                            My <span>Games</span>
                        </h1>

                        <p>
                            Browse every saved ChessVision analysis and reopen any
                            review whenever you need it.
                        </p>
                    </div>

                    <Link className="dashboard-primary-button" to="/analyze">
                        <span>+</span>
                        Analyze New Game
                    </Link>
                </header>

                <section className="games-filter-panel">
                    <form
                        className="games-search-form"
                        onSubmit={handleSearchSubmit}
                    >
                        <span className="games-search-icon">⌕</span>

                        <input
                            type="search"
                            value={searchDraft}
                            onChange={(event) =>
                                setSearchDraft(event.target.value)
                            }
                            placeholder="Search player or event..."
                            aria-label="Search games"
                        />

                        <button type="submit">Search</button>
                    </form>

                    <label className="games-filter-field">
                        <span>Source</span>

                        <select
                            value={sourceFilter}
                            onChange={(event) => {
                                setPage(1);
                                setSourceFilter(event.target.value);
                            }}
                        >
                            <option value="all">All sources</option>
                            <option value="pasted_pgn">Pasted PGN</option>
                            <option value="pgn_file">PGN file</option>
                            <option value="lichess">Lichess</option>
                            <option value="chesscom">Chess.com</option>
                        </select>
                    </label>

                    <label className="games-filter-field">
                        <span>Analysis</span>

                        <select
                            value={modeFilter}
                            onChange={(event) => {
                                setPage(1);
                                setModeFilter(event.target.value);
                            }}
                        >
                            <option value="all">All modes</option>
                            <option value="quick">Quick</option>
                            <option value="standard">Standard</option>
                            <option value="deep">Deep</option>
                        </select>
                    </label>

                    <button
                        className="games-clear-button"
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                    >
                        Reset
                    </button>
                </section>

                {historyError && (
                    <p className="auth-message auth-message-error">
                        {historyError}
                    </p>
                )}

                <section className="games-history-panel">
                    <div className="games-history-heading">
                        <div>
                            <p className="panel-kicker">Saved analyses</p>
                            <h2>
                                {isLoading
                                    ? "Loading games..."
                                    : `${totalGames} ${
                                        totalGames === 1
                                            ? "game"
                                            : "games"
                                    } found`}
                            </h2>
                        </div>

                        {!isLoading && totalGames > 0 && (
                            <span className="games-page-counter">
                                Page {currentPage} of {totalPages}
                            </span>
                        )}
                    </div>

                    <div className="games-history-table-wrapper">
                        <table className="games-history-table">
                            <thead>
                            <tr>
                                <th>Game</th>
                                <th>Result</th>
                                <th>Source</th>
                                <th>Analysis</th>
                                <th>Accuracy</th>
                                <th>Errors</th>
                                <th>Date</th>
                                <th />
                            </tr>
                            </thead>

                            <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="games-table-message">
                                        Loading your saved analyses…
                                    </td>
                                </tr>
                            ) : games.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="games-table-message">
                                        <strong>No games found.</strong>

                                        <span>
                                                {hasActiveFilters
                                                    ? "Try changing or resetting your filters."
                                                    : "Analyze your first game to build your history."}
                                            </span>
                                    </td>
                                </tr>
                            ) : (
                                games.map((game) => {
                                    const resultInfo = getResultInfo(
                                        game.result,
                                    );

                                    return (
                                        <tr key={game.gameId}>
                                            <td>
                                                <div className="game-history-players">
                                                        <span className="game-history-player-avatar">
                                                            {game.whitePlayer
                                                                    ?.charAt(0)
                                                                    ?.toUpperCase() ||
                                                                "W"}
                                                        </span>

                                                    <div>
                                                        <strong>
                                                            {game.whitePlayer ||
                                                                "White"}
                                                            <span> vs </span>
                                                            {game.blackPlayer ||
                                                                "Black"}
                                                        </strong>

                                                        <small>
                                                            {game.eventName ||
                                                                "Imported game"}{" "}
                                                            ·{" "}
                                                            {game.moveCount ||
                                                                0}{" "}
                                                            moves
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                    <span
                                                        className={`game-history-result ${resultInfo.className}`}
                                                    >
                                                        {resultInfo.label}
                                                    </span>
                                            </td>

                                            <td>
                                                    <span className="game-history-source">
                                                        {formatSource(game.source)}
                                                    </span>
                                            </td>

                                            <td>
                                                    <span className="game-history-mode">
                                                        {formatMode(game.mode)}
                                                    </span>
                                            </td>

                                            <td className="games-history-accuracy">
                                                {formatAccuracy(game.accuracy)}
                                            </td>

                                            <td>
                                                <div className="games-history-errors">
                                                    <strong>
                                                        {game.blunders ?? 0}
                                                    </strong>
                                                    <span>
                                                            blunders ·{" "}
                                                        {game.mistakes ?? 0}{" "}
                                                        mistakes
                                                        </span>
                                                </div>
                                            </td>

                                            <td className="games-history-date">
                                                {formatDate(game.createdAt)}
                                            </td>

                                            <td>
                                                <Link
                                                    className="table-action-button"
                                                    to={`/review/${game.gameId}`}
                                                    aria-label={`Open ${game.whitePlayer} versus ${game.blackPlayer}`}
                                                    title="Open saved review"
                                                >
                                                    →
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && totalGames > 0 && (
                        <div className="games-pagination">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(1, current - 1),
                                    )
                                }
                                disabled={currentPage <= 1}
                            >
                                ← Previous
                            </button>

                            <span>
                                Page <strong>{currentPage}</strong> of{" "}
                                <strong>{totalPages}</strong>
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.min(totalPages, current + 1),
                                    )
                                }
                                disabled={currentPage >= totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </section>
            </section>
        </AppShell>
    );
}

export default MyGamesPage;