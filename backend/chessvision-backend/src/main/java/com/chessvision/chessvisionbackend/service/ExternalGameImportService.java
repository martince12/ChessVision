package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.ExternalGameImportResponse;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExternalGameImportService {

    private static final Pattern LICHESS_GAME_ID_PATTERN =
            Pattern.compile("^[A-Za-z0-9]{8,16}$");

    private static final Pattern CHESS_COM_GAME_PATH_PATTERN =
            Pattern.compile(
                    "^/game/(live|daily)/(\\d+)(?:/.*)?$",
                    Pattern.CASE_INSENSITIVE
            );

    private static final Pattern CHESS_COM_DATE_PATTERN =
            Pattern.compile("^(\\d{4})\\.(\\d{2})\\.\\d{2}$");

    private static final Duration REQUEST_TIMEOUT =
            Duration.ofSeconds(18);

    private final HttpClient httpClient;
    private final JsonMapper  objectMapper;

    public ExternalGameImportService(JsonMapper  objectMapper) {
        this.objectMapper = objectMapper;

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public ExternalGameImportResponse importLichessGame(String rawUrl) {
        try {
            String gameId = extractLichessGameId(rawUrl);

            String pgn = fetchText(
                    "https://lichess.org/game/export/" + gameId,
                    "application/x-chess-pgn"
            );

            if (pgn.isBlank()) {
                return failure(
                        "Lichess returned an empty PGN for this game.",
                        "Lichess"
                );
            }

            return new ExternalGameImportResponse(
                    true,
                    "Lichess game imported successfully.",
                    "Lichess",
                    pgn.trim()
            );

        } catch (IllegalArgumentException exception) {
            return failure(exception.getMessage(), "Lichess");

        } catch (IOException exception) {
            return failure(
                    "Could not import this Lichess game. "
                            + "Check that the game is public and the link is valid.",
                    "Lichess"
            );
        }
    }

    public ExternalGameImportResponse importChessComGame(String rawUrl) {
        try {
            ChessComGameReference reference =
                    extractChessComGameReference(rawUrl);

            String callbackUrl =
                    "https://www.chess.com/callback/"
                            + reference.gameType()
                            + "/game/"
                            + reference.gameId();

            JsonNode callbackJson = fetchJson(callbackUrl);

            JsonNode headers = callbackJson
                    .path("game")
                    .path("pgnHeaders");

            String whitePlayer = getFirstNonBlank(
                    headers.path("White").asText(),
                    headers.path("white").asText()
            );

            String gameDate = getFirstNonBlank(
                    headers.path("Date").asText(),
                    headers.path("date").asText()
            );

            if (whitePlayer.isBlank() || gameDate.isBlank()) {
                return failure(
                        "Chess.com did not return enough public data "
                                + "for this game.",
                        "Chess.com"
                );
            }

            Matcher dateMatcher =
                    CHESS_COM_DATE_PATTERN.matcher(gameDate);

            if (!dateMatcher.matches()) {
                return failure(
                        "Chess.com returned an unsupported game date.",
                        "Chess.com"
                );
            }

            String year = dateMatcher.group(1);
            String month = dateMatcher.group(2);

            String encodedUsername = URLEncoder.encode(
                    whitePlayer.toLowerCase(Locale.ROOT),
                    StandardCharsets.UTF_8
            );

            String archiveUrl =
                    "https://api.chess.com/pub/player/"
                            + encodedUsername
                            + "/games/"
                            + year
                            + "/"
                            + month;

            JsonNode archiveJson = fetchJson(archiveUrl);

            for (JsonNode game : archiveJson.path("games")) {
                String publicGameUrl = game.path("url").asText();

                if (!reference.gameId().equals(
                        getLastPathSegment(publicGameUrl)
                )) {
                    continue;
                }

                String pgn = game.path("pgn").asText();

                if (pgn.isBlank()) {
                    return failure(
                            "Chess.com found the game, but no PGN "
                                    + "was available for it.",
                            "Chess.com"
                    );
                }

                return new ExternalGameImportResponse(
                        true,
                        "Chess.com game imported successfully.",
                        "Chess.com",
                        pgn.trim()
                );
            }

            return failure(
                    "The game was not found in Chess.com's public archive yet. "
                            + "Try again shortly or import its downloaded PGN file.",
                    "Chess.com"
            );

        } catch (IllegalArgumentException exception) {
            return failure(exception.getMessage(), "Chess.com");

        } catch (IOException exception) {
            return failure(
                    "Could not import this Chess.com game. "
                            + "Check that it is a finished public live or daily game.",
                    "Chess.com"
            );
        }
    }

    private String extractLichessGameId(String rawUrl) {
        URI uri = parseUri(rawUrl);

        String host = normalizeHost(uri.getHost());

        if (!host.equals("lichess.org")
                && !host.equals("www.lichess.org")) {
            throw new IllegalArgumentException(
                    "Paste a valid Lichess game link."
            );
        }

        String path = uri.getPath() == null
                ? ""
                : uri.getPath();

        String[] parts = path.split("/");

        String gameId = "";

        if (parts.length >= 4
                && "game".equals(parts[1])
                && "export".equals(parts[2])) {
            gameId = parts[3];
        } else if (parts.length >= 2) {
            gameId = parts[1];
        }

        if (!LICHESS_GAME_ID_PATTERN.matcher(gameId).matches()) {
            throw new IllegalArgumentException(
                    "ChessVision could not find a valid Lichess game ID "
                            + "in that link."
            );
        }

        return gameId;
    }

    private ChessComGameReference extractChessComGameReference(
            String rawUrl
    ) {
        URI uri = parseUri(rawUrl);

        String host = normalizeHost(uri.getHost());

        if (!host.equals("chess.com")
                && !host.equals("www.chess.com")) {
            throw new IllegalArgumentException(
                    "Paste a valid Chess.com game link."
            );
        }

        String path = uri.getPath() == null
                ? ""
                : uri.getPath();

        Matcher matcher =
                CHESS_COM_GAME_PATH_PATTERN.matcher(path);

        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                    "ChessVision currently supports Chess.com live "
                            + "and daily game links."
            );
        }

        return new ChessComGameReference(
                matcher.group(1).toLowerCase(Locale.ROOT),
                matcher.group(2)
        );
    }

    private URI parseUri(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "Paste a game link before importing."
            );
        }

        try {
            URI uri = URI.create(rawUrl.trim());

            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || uri.getHost() == null) {
                throw new IllegalArgumentException(
                        "Paste a complete HTTPS game link."
                );
            }

            return uri;

        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "Paste a valid game link."
            );
        }
    }

    private JsonNode fetchJson(String url) throws IOException {
        String response = fetchText(url, "application/json");

        try {
            return objectMapper.readTree(response);
        } catch (Exception exception) {
            throw new IOException(
                    "The external service returned invalid JSON.",
                    exception
            );
        }
    }

    private String fetchText(String url, String acceptHeader)
            throws IOException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(REQUEST_TIMEOUT)
                .header("Accept", acceptHeader)
                .header(
                        "User-Agent",
                        "ChessVision/0.1 (local academic project)"
                )
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(
                            StandardCharsets.UTF_8
                    )
            );

            if (response.statusCode() != 200) {
                throw new IOException(
                        "External service returned HTTP "
                                + response.statusCode()
                );
            }

            return response.body();

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IOException(
                    "Import request was interrupted.",
                    exception
            );
        }
    }

    private String getLastPathSegment(String rawUrl) {
        try {
            String path = URI.create(rawUrl)
                    .getPath()
                    .replaceAll("/+$", "");

            int slashIndex = path.lastIndexOf("/");

            return slashIndex >= 0
                    ? path.substring(slashIndex + 1)
                    : path;

        } catch (Exception exception) {
            return "";
        }
    }

    private String getFirstNonBlank(
            String firstValue,
            String secondValue
    ) {
        if (firstValue != null && !firstValue.isBlank()) {
            return firstValue.trim();
        }

        if (secondValue != null && !secondValue.isBlank()) {
            return secondValue.trim();
        }

        return "";
    }

    private String normalizeHost(String host) {
        return host == null
                ? ""
                : host.toLowerCase(Locale.ROOT);
    }

    private ExternalGameImportResponse failure(
            String message,
            String source
    ) {
        return new ExternalGameImportResponse(
                false,
                message,
                source,
                null
        );
    }

    private record ChessComGameReference(
            String gameType,
            String gameId
    ) {
    }
}