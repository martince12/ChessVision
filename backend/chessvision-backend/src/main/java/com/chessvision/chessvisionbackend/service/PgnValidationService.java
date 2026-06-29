package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.PgnValidationResponse;
import com.github.bhlangonijr.chesslib.move.MoveList;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PgnValidationService {

    private static final Pattern HEADER_PATTERN =
            Pattern.compile("^\\s*\\[([A-Za-z0-9_]+)\\s+\"([^\"]*)\"\\]\\s*$");

    private static final Pattern BRACE_COMMENT_PATTERN =
            Pattern.compile("\\{[^}]*}");

    private static final Pattern LINE_COMMENT_PATTERN =
            Pattern.compile("(?m);.*$");

    private static final Pattern NAG_PATTERN =
            Pattern.compile("\\$\\d+");

    private static final Pattern RESULT_PATTERN =
            Pattern.compile("(1-0|0-1|1/2-1/2|\\*)\\s*$");

    private static final Pattern SIMPLE_VARIATION_PATTERN =
            Pattern.compile("\\([^()]*\\)");

    public PgnValidationResponse validatePgn(String rawPgn) {
        try {
            String pgn = normalizePgn(rawPgn);
            Map<String, String> headers = extractHeaders(pgn);
            String moveText = extractMoveText(pgn);

            if (moveText.isBlank()) {
                return invalidResponse(
                        "No playable moves were found in this PGN."
                );
            }

            MoveList moves = new MoveList();
            moves.loadFromSan(moveText);

            int halfMoveCount = moves.size();

            if (halfMoveCount == 0) {
                return invalidResponse(
                        "No playable moves were found in this PGN."
                );
            }

            return new PgnValidationResponse(
                    true,
                    "PGN is valid and ready for analysis.",
                    getHeader(headers, "white", "White Player"),
                    getHeader(headers, "black", "Black Player"),
                    getHeader(headers, "result", "*"),
                    (halfMoveCount + 1) / 2,
                    halfMoveCount,
                    getHeader(headers, "event", "Imported Game"),
                    getHeader(headers, "site", "Unknown"),
                    getHeader(headers, "date", "Unknown"),
                    getHeader(headers, "timecontrol", "Unknown"),
                    parseElo(headers.get("whiteelo")),
                    parseElo(headers.get("blackelo"))
            );

        } catch (Exception exception) {
            return invalidResponse(
                    "ChessVision could not read this PGN. Check the notation and try again."
            );
        }
    }

    private String normalizePgn(String rawPgn) {
        return rawPgn
                .replace("\uFEFF", "")
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .trim();
    }

    private Map<String, String> extractHeaders(String pgn) {
        Map<String, String> headers = new HashMap<>();

        for (String line : pgn.split("\\R")) {
            Matcher matcher = HEADER_PATTERN.matcher(line);

            if (matcher.matches()) {
                headers.put(
                        matcher.group(1).toLowerCase(Locale.ROOT),
                        matcher.group(2).trim()
                );
            }
        }

        return headers;
    }

    private String extractMoveText(String pgn) {
        StringBuilder moveText = new StringBuilder();

        for (String line : pgn.split("\\R")) {
            if (!HEADER_PATTERN.matcher(line).matches()) {
                moveText.append(line).append("\n");
            }
        }

        String cleaned = moveText.toString();

        cleaned = BRACE_COMMENT_PATTERN.matcher(cleaned).replaceAll(" ");
        cleaned = LINE_COMMENT_PATTERN.matcher(cleaned).replaceAll(" ");
        cleaned = NAG_PATTERN.matcher(cleaned).replaceAll(" ");

        String previous;

        do {
            previous = cleaned;
            cleaned = SIMPLE_VARIATION_PATTERN.matcher(cleaned).replaceAll(" ");
        } while (!cleaned.equals(previous));

        cleaned = RESULT_PATTERN.matcher(cleaned.trim()).replaceAll("");

        return cleaned
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String getHeader(
            Map<String, String> headers,
            String key,
            String fallbackValue
    ) {
        String value = headers.get(key);

        return value == null || value.isBlank()
                ? fallbackValue
                : value;
    }

    private Integer parseElo(String value) {
        if (value == null || value.isBlank() || value.equals("?")) {
            return null;
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private PgnValidationResponse invalidResponse(String message) {
        return new PgnValidationResponse(
                false,
                message,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}