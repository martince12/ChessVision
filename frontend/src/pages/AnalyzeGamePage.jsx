import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import AppShell from "../components/layout/AppShell";
import GuestAnalysisShell from "../components/layout/GuestAnalysisShell";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";

const importMethods = [
    {
        id: "pgn",
        icon: "⌘",
        title: "Paste PGN",
        description: "Paste a full game notation directly into ChessVision.",
    },
    {
        id: "file",
        icon: "↑",
        title: "Upload PGN File",
        description: "Upload a .pgn file downloaded from your chess platform.",
    },
    {
        id: "lichess",
        icon: "♞",
        title: "Import from Lichess",
        description: "Paste a public Lichess game link and import it instantly.",
    },
    {
        id: "chesscom",
        icon: "♛",
        title: "Import from Chess.com",
        description: "Paste a public Chess.com game link for analysis.",
    },
    {
        id: "manual",
        icon: "✦",
        title: "Create Manually",
        description: "Play or recreate moves directly on an interactive board.",
    },
];

const analysisModes = [
    {
        id: "quick",
        title: "Quick",
        subtitle: "Fast overview",
        description: "A fast review for your most important mistakes.",
        depth: "Depth 12–14",
    },
    {
        id: "standard",
        title: "Standard",
        subtitle: "Recommended",
        description: "The best balance between speed and useful detail.",
        depth: "Depth 16–18",
    },
    {
        id: "deep",
        title: "Deep",
        subtitle: "Detailed engine review",
        description: "More calculation, more variations, more insights.",
        depth: "Depth 20–24",
    },
];

const setupBoardSquares = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const column = index % 8;
    const blackBackRank = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
    const whiteBackRank = ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"];

    let piece = "";

    if (row === 0) {
        piece = blackBackRank[column];
    }

    if (row === 1) {
        piece = "♟";
    }

    if (row === 6) {
        piece = "♙";
    }

    if (row === 7) {
        piece = whiteBackRank[column];
    }

    return {
        id: index,
        piece,
        isLight: (row + column) % 2 === 0,
    };
});

function AnalyzeGamePage() {
    const [selectedMethod, setSelectedMethod] = useState("pgn");
    const [selectedMode, setSelectedMode] = useState("standard");
    const [pgnText, setPgnText] = useState("");
    const [gameLink, setGameLink] = useState("");
    const [fileName, setFileName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [gameDetected, setGameDetected] = useState(false);
    const [isAnalyzingGame, setIsAnalyzingGame] = useState(false);
    const [analysisError, setAnalysisError] = useState("");
    const navigate = useNavigate();
    const [pgnMetadata, setPgnMetadata] = useState(null);
    const [isValidatingPgn, setIsValidatingPgn] = useState(false);
    const fileInputRef = useRef(null);
    const { user } = useAuth();
    const PageShell = user ? AppShell : GuestAnalysisShell;

    const [importSource, setImportSource] =
        useState("Pasted PGN");

    const [isImportingExternalGame, setIsImportingExternalGame] =
        useState(false);

    function selectMethod(methodId) {
        setSelectedMethod(methodId);
        setErrorMessage("");
        setGameDetected(false);
        setIsAnalyzingGame(false);
        setAnalysisError("");
        setPgnMetadata(null);
    }

    function handleFileChange(event) {
        const selectedFile = event.target.files[0];

        if (!selectedFile) {
            return;
        }

        setFileName(selectedFile.name);
        setErrorMessage("");
        setGameDetected(false);
    }

    async function validateImportedPgn(rawPgn, source) {
        const normalizedPgn = rawPgn.trim();

        if (!normalizedPgn) {
            setErrorMessage("No PGN content was found.");
            setGameDetected(false);
            return false;
        }

        setIsValidatingPgn(true);
        setErrorMessage("");
        setAnalysisError("");
        setGameDetected(false);
        setPgnMetadata(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/games/validate-pgn`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        pgn: normalizedPgn,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok || !data.valid) {
                setErrorMessage(
                    data.message || "ChessVision could not validate this PGN.",
                );
                return false;
            }

            setPgnText(normalizedPgn);
            setImportSource(source);
            setPgnMetadata(data);
            setGameDetected(true);

            return true;
        } catch {
            setErrorMessage(
                "Could not connect to the backend. Check that Spring Boot is running on port 8080.",
            );

            return false;
        } finally {
            setIsValidatingPgn(false);
        }
    }

    async function handlePgnFileSelected(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > 1_000_000) {
            setErrorMessage(
                "This PGN file is too large. Maximum supported size is 1 MB.",
            );
            return;
        }

        if (!file.name.toLowerCase().endsWith(".pgn")) {
            setErrorMessage("Choose a valid .pgn file.");
            return;
        }

        try {
            const pgnFromFile = await file.text();

            if (!pgnFromFile.trim()) {
                setErrorMessage("The selected PGN file is empty.");
                return;
            }

            setPgnText(pgnFromFile);
            setFileName(file.name);
            setImportSource(`PGN file: ${file.name}`);

            setErrorMessage("");
            setAnalysisError("");
            setGameDetected(false);
            setPgnMetadata(null);
        } catch {
            setErrorMessage("ChessVision could not read that PGN file.");
        } finally {
            event.target.value = "";
        }
    }

    async function importExternalGame(endpoint, fallbackSource) {
        if (!gameLink.trim()) {
            setErrorMessage("Paste a game link before importing.");
            return;
        }

        setIsImportingExternalGame(true);
        setErrorMessage("");
        setAnalysisError("");
        setGameDetected(false);
        setPgnMetadata(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gameUrl: gameLink.trim(),
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok || !data.imported) {
                setErrorMessage(
                    data.message || "ChessVision could not import this game.",
                );
                return;
            }

            await validateImportedPgn(
                data.pgn,
                data.source || fallbackSource,
            );
        } catch {
            setErrorMessage(
                "Could not connect to the backend. Check that Spring Boot is running.",
            );
        } finally {
            setIsImportingExternalGame(false);
        }
    }

    async function handleContinue() {
        setErrorMessage("");
        setAnalysisError("");

        if (selectedMethod === "pgn") {
            await validateImportedPgn(
                pgnText,
                "Pasted PGN",
            );

            return;
        }

        if (selectedMethod === "file") {
            if (!pgnText.trim() || !fileName) {
                setErrorMessage("Choose a .pgn file first.");
                return;
            }

            await validateImportedPgn(
                pgnText,
                `PGN file: ${fileName}`,
            );

            return;
        }

        if (selectedMethod === "lichess") {
            await importExternalGame(
                "/api/import/lichess",
                "Lichess",
            );

            return;
        }

        if (selectedMethod === "chesscom") {
            await importExternalGame(
                "/api/import/chesscom",
                "Chess.com",
            );

            return;
        }

        setErrorMessage(
            "Manual board creation is coming soon. Choose another import method.",
        );
    }

    async function handleStartAnalysis() {
        if (!pgnMetadata) {
            setErrorMessage("Validate the PGN before starting the analysis.");
            return;
        }

        setIsAnalyzingGame(true);
        setAnalysisError("");
        setErrorMessage("");

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const isGuestAnalysis = !session?.access_token;

            const headers = {
                "Content-Type": "application/json",
            };

            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            const response = await fetch(
                `${API_BASE_URL}${
                    isGuestAnalysis
                        ? "/api/analysis/full-game/guest"
                        : "/api/analysis/full-game"
                }`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        pgn: pgnText.trim(),
                        mode: selectedMode,

                        source:
                            selectedMethod === "file"
                                ? "pgn_file"
                                : selectedMethod === "lichess"
                                    ? "lichess"
                                    : selectedMethod === "chesscom"
                                        ? "chesscom"
                                        : selectedMethod === "manual"
                                            ? "manual"
                                            : "pasted_pgn",

                        sourceUrl:
                            selectedMethod === "lichess" ||
                            selectedMethod === "chesscom"
                                ? gameLink.trim()
                                : null,
                    }),
                },
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.available) {
                setAnalysisError(
                    data.message ||
                    "ChessVision could not complete the game analysis.",
                );
                return;
            }

            navigate("/review", {
                state: {
                    pgn: pgnText.trim(),
                    source: importSource,
                    analysisMode: selectedMode,
                    metadata: pgnMetadata,
                    fullGameAnalysis: data,
                    isGuest: isGuestAnalysis,
                },
            });
        } catch {
            setAnalysisError(
                "Could not connect to the backend. Check that Spring Boot is running.",
            );
        } finally {
            setIsAnalyzingGame(false);
        }
    }

    function renderImportArea() {
        if (selectedMethod === "pgn") {
            return (
                <div className="import-input-area">
                    <label className="import-input-label" htmlFor="pgn-input">
                        Paste your PGN
                        <span>Include headers and moves when available.</span>
                    </label>

                    <textarea
                        id="pgn-input"
                        className="pgn-textarea"
                        placeholder={`[Event "Rated Rapid game"]
[White "Your Username"]
[Black "Opponent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ...`}
                        value={pgnText}
                        onChange={(event) => {
                            setPgnText(event.target.value);
                            setErrorMessage("");
                            setGameDetected(false);
                            setPgnMetadata(null);
                        }}
                    />

                    <div className="input-help-row">
                        <span>Supported: standard PGN notation</span>
                        <span>{pgnText.length} characters</span>
                    </div>
                </div>
            );
        }

        if (selectedMethod === "file") {
            return (
                <div className="upload-area">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pgn,application/x-chess-pgn,text/plain"
                        hidden
                        onChange={handlePgnFileSelected}
                    />

                    <button
                        className="import-file-button"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span>↑</span>
                        {fileName ? "Replace PGN file" : "Choose PGN file"}
                    </button>

                    {fileName && (
                        <p className="import-file-name">
                            Selected: {fileName}
                        </p>
                    )}
                </div>
            );
        }

        if (selectedMethod === "lichess") {
            return (
                <div className="import-input-area">
                    <label className="import-input-label" htmlFor="lichess-link">
                        Public Lichess game link
                        <span>Example: lichess.org/xxxxxxxx</span>
                    </label>

                    <div className="link-input-wrapper">
                        <span className="link-input-icon">♞</span>

                        <input
                            id="lichess-link"
                            type="url"
                            placeholder="https://lichess.org/..."
                            value={gameLink}
                            onChange={(event) => {
                                setGameLink(event.target.value);
                                setErrorMessage("");
                                setGameDetected(false);
                            }}
                        />
                    </div>

                    <p className="link-note">
                        ChessVision will extract the PGN and game metadata from a public
                        Lichess game.
                    </p>
                </div>
            );
        }

        if (selectedMethod === "chesscom") {
            return (
                <div className="import-input-area">
                    <label className="import-input-label" htmlFor="chesscom-link">
                        Public Chess.com game link
                        <span>Example: chess.com/game/live/...</span>
                    </label>

                    <div className="link-input-wrapper">
                        <span className="link-input-icon">♛</span>

                        <input
                            id="chesscom-link"
                            type="url"
                            placeholder="https://www.chess.com/game/..."
                            value={gameLink}
                            onChange={(event) => {
                                setGameLink(event.target.value);
                                setErrorMessage("");
                                setGameDetected(false);
                            }}
                        />
                    </div>

                    <p className="link-note">
                        Use a public game link. Later the backend will convert the game
                        into standard PGN automatically.
                    </p>
                </div>
            );
        }

        return (
            <div className="manual-board-area">
                <div className="manual-board-copy">
                    <span className="manual-board-badge">Manual board</span>
                    <h3>Recreate a game move by move.</h3>
                    <p>
                        The interactive move editor will allow legal moves, undo, redo,
                        starting FEN positions, and PGN export.
                    </p>

                    <button
                        className="manual-board-button"
                        type="button"
                        onClick={() => {
                            setGameDetected(true);
                            setErrorMessage("");
                            setIsAnalyzingGame(false);
                            setAnalysisError("");
                        }}
                    >
                        Open manual board
                        <span>→</span>
                    </button>
                </div>

                <div className="manual-board-preview">
                    {setupBoardSquares.map((square) => (
                        <div
                            className={`manual-square ${
                                square.isLight ? "manual-light" : "manual-dark"
                            }`}
                            key={square.id}
                        >
                            {square.piece}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function getSourceLabel() {
        if (selectedMethod === "pgn") return "Pasted PGN";
        if (selectedMethod === "file") return "Uploaded PGN";
        if (selectedMethod === "lichess") return "Lichess import";
        if (selectedMethod === "chesscom") return "Chess.com import";
        return "Manual board";
    }

    return (
        <PageShell>
            <section className="analyze-page">
                <header className="analyze-header">
                    <div>
                        <p className="dashboard-date">NEW ANALYSIS</p>
                        <h1>
                            Analyze your <span>game.</span>
                        </h1>
                        <p>
                            Import one chess game, choose an analysis level, and let
                            ChessVision uncover the moments that mattered most.
                        </p>
                    </div>

                    <div className="analyze-header-status">
                        <span className="header-status-dot" />
                        Backend connected
                    </div>
                </header>
                {!user && (
                    <section className="guest-analysis-notice">
                        <div>
                            <span className="guest-analysis-notice-icon">♞</span>

                            <div>
                                <strong>You are analyzing as a guest.</strong>
                                <p>
                                    Your result is temporary and will not be saved to your
                                    ChessVision history.
                                </p>
                            </div>
                        </div>

                        <Link to="/register">
                            Create a free account <span>→</span>
                        </Link>
                    </section>
                )}
                <div className="analyze-layout">
                    <section className="import-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">Step 1</p>
                                <h2>Choose game source</h2>
                            </div>

                            <span className="step-label">1 of 3</span>
                        </div>

                            <div className="import-method-grid">
                                {importMethods.map((method) => {
                                    const isManualMethod = method.id === "manual";

                                    return (
                                        <button
                                            className={`import-method-card ${
                                                selectedMethod === method.id
                                                    ? "import-method-active"
                                                    : ""
                                            } ${
                                                isManualMethod
                                                    ? "import-method-disabled"
                                                    : ""
                                            }`}
                                            type="button"
                                            key={method.id}
                                            disabled={isManualMethod}
                                            onClick={() => selectMethod(method.id)}
                                        >
                                            <span className="import-method-icon">
                                                {method.icon}
                                            </span>

                                            <span className="import-method-content">
                                                <strong>{method.title}</strong>
                                                <small>
                                                    {isManualMethod
                                                        ? "Coming soon"
                                                        : method.description}
                                                </small>
                                            </span>

                                            <span className="method-select-circle">
                                                {selectedMethod === method.id && !isManualMethod
                                                    ? "✓"
                                                    : ""}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                        <div className="selected-import-content">{renderImportArea()}</div>

                        {errorMessage && (
                            <div className="import-error-message">
                                <span>!</span>
                                {errorMessage}
                            </div>
                        )}

                        <button
                            className="continue-import-button"
                            type="button"
                            onClick={handleContinue}
                            disabled={isValidatingPgn || isImportingExternalGame}
                        >
                            {isValidatingPgn ? (
                                <>
                                    <span className="button-spinner"/>
                                    Validating PGN...
                                </>
                            ) : isImportingExternalGame ? (
                                <>
                                    <span className="button-spinner"/>
                                    Importing game...
                                </>
                            ) : (
                                <>
                                    {selectedMethod === "pgn" && "Validate pasted PGN"}
                                    {selectedMethod === "file" && "Validate PGN file"}
                                    {selectedMethod === "lichess" && "Import Lichess game"}
                                    {selectedMethod === "chesscom" && "Import Chess.com game"}
                                    {selectedMethod === "manual" && "Manual setup coming soon"}
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    </section>

                    <aside className="analyze-sidebar-info">
                        <article className="analysis-info-card">
                            <div className="analysis-info-icon">✦</div>
                            <h3>What ChessVision checks</h3>

                            <ul>
                                <li>
                                    <span>✓</span>
                                    Best moves and recommended lines
                                </li>
                                <li>
                                    <span>✓</span>
                                    Inaccuracies, mistakes, and blunders
                                </li>
                                <li>
                                    <span>✓</span>
                                    Accuracy for both players
                                </li>
                                <li>
                                    <span>✓</span>
                                    Critical moments and missed wins
                                </li>
                                <li>
                                    <span>✓</span>
                                    Estimated game performance range
                                </li>
                            </ul>
                        </article>

                        <article className="analysis-tip-card">
                            <p className="panel-kicker">Helpful tip</p>
                            <h3>More moves mean more insights.</h3>
                            <p>
                                Full PGNs with player names, time control, and result create a
                                more complete analysis report.
                            </p>
                        </article>
                    </aside>
                </div>

                {gameDetected && (
                    <section className="game-detected-section">
                        <div className="game-detected-header">
                            <div>
                                <p className="panel-kicker">Step 2</p>
                                <h2>Game detected and ready for analysis.</h2>
                                <p>
                                    Review the imported game information, then choose how deeply
                                    Stockfish should calculate.
                                </p>
                            </div>

                            <span className="detected-badge">
                <span>✓</span>
                Ready
              </span>
                        </div>

                        <div className="game-summary-grid">
                            <article className="game-summary-card">
                                <span>Source</span>
                                <strong>
                                    {pgnMetadata?.eventName || getSourceLabel()}
                                </strong>
                            </article>

                            <article className="game-summary-card">
                                <span>Players</span>
                                <strong>
                                    {pgnMetadata?.whitePlayer} vs {pgnMetadata?.blackPlayer}
                                </strong>
                            </article>

                            <article className="game-summary-card">
                                <span>Result</span>
                                <strong>{pgnMetadata?.result}</strong>
                            </article>

                            <article className="game-summary-card">
                                <span>Moves</span>
                                <strong>
                                    {pgnMetadata?.moveCount} full moves · {pgnMetadata?.halfMoveCount} plies
                                </strong>
                            </article>
                        </div>

                        <div className="analysis-mode-heading">
                            <div>
                                <p className="panel-kicker">Step 3</p>
                                <h2>Choose analysis mode</h2>
                            </div>

                            <p>Standard is recommended for most games.</p>
                        </div>

                        <div className="analysis-mode-grid">
                            {analysisModes.map((mode) => (
                                <button
                                    className={`analysis-mode-card ${
                                        selectedMode === mode.id ? "analysis-mode-active" : ""
                                    }`}
                                    type="button"
                                    key={mode.id}
                                    onClick={() => {
                                        setSelectedMode(mode.id);
                                        setIsAnalyzingGame(false);
                                        setAnalysisError("");
                                    }}
                                >
                                    <div className="analysis-mode-top">
                    <span className="mode-radio">
                      {selectedMode === mode.id ? "●" : ""}
                    </span>
                                        <span className="mode-depth">{mode.depth}</span>
                                    </div>

                                    <strong>{mode.title}</strong>
                                    <small>{mode.subtitle}</small>
                                    <p>{mode.description}</p>
                                </button>
                            ))}
                        </div>

                        <button
                            className="start-analysis-button"
                            type="button"
                            onClick={handleStartAnalysis}
                            disabled={isAnalyzingGame}
                        >
                            {isAnalyzingGame ? (
                                <>
                                    <span className="button-spinner"/>
                                    Analyzing full game...
                                </>
                            ) : (
                                <>
                                    Start {selectedMode} analysis
                                    <span>→</span>
                                </>
                            )}
                        </button>
                        {analysisError && (
                            <div className="analysis-full-error">
                                <span>!</span>
                                {analysisError}
                            </div>
                        )}

                    </section>
                )}
            </section>
        </PageShell>
    );
}

export default AnalyzeGamePage;