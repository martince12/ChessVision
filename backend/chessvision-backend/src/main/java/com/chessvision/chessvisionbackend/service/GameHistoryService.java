package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.GameHistoryResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class GameHistoryService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 30;

    private final JdbcTemplate jdbcTemplate;

    public GameHistoryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public GameHistoryResponse getGames(
            UUID userId,
            Integer requestedPage,
            Integer requestedPageSize,
            String requestedSource,
            String requestedMode,
            String requestedSearch
    ) {
        int page = requestedPage == null
                ? 1
                : Math.max(1, requestedPage);

        int pageSize = requestedPageSize == null
                ? DEFAULT_PAGE_SIZE
                : Math.max(1, Math.min(MAX_PAGE_SIZE, requestedPageSize));

        String source = normalizeSource(requestedSource);
        String mode = normalizeMode(requestedMode);
        String search = normalizeSearch(requestedSearch);

        String whereClause = """
                where g.user_id = ?
                  and ga.status = 'completed'
                """;

        List<Object> parameters = new ArrayList<>();
        parameters.add(userId);

        if (source != null) {
            whereClause += " and g.source = ? ";
            parameters.add(source);
        }

        if (mode != null) {
            whereClause += " and lower(ga.mode) = ? ";
            parameters.add(mode);
        }

        if (search != null) {
            whereClause += """
                    and (
                        lower(coalesce(g.white_player, '')) like ?
                        or lower(coalesce(g.black_player, '')) like ?
                        or lower(coalesce(g.event_name, '')) like ?
                    )
                    """;

            String searchValue = "%" + search + "%";

            parameters.add(searchValue);
            parameters.add(searchValue);
            parameters.add(searchValue);
        }

        long totalGames = loadTotalGames(whereClause, parameters);

        int totalPages = totalGames == 0
                ? 1
                : (int) Math.ceil((double) totalGames / pageSize);

        if (page > totalPages) {
            page = totalPages;
        }

        int offset = (page - 1) * pageSize;

        List<GameHistoryResponse.GameHistoryItemResponse> games =
                loadGames(
                        whereClause,
                        parameters,
                        pageSize,
                        offset
                );

        return new GameHistoryResponse(
                games,
                page,
                pageSize,
                totalGames,
                totalPages
        );
    }

    private long loadTotalGames(
            String whereClause,
            List<Object> parameters
    ) {
        String sql = """
                select count(*)
                from public.games g
                join public.game_analyses ga
                    on ga.game_id = g.id
                """ + whereClause;

        Long result = jdbcTemplate.queryForObject(
                sql,
                Long.class,
                parameters.toArray()
        );

        return result == null ? 0 : result;
    }

    private List<GameHistoryResponse.GameHistoryItemResponse> loadGames(
            String whereClause,
            List<Object> parameters,
            int pageSize,
            int offset
    ) {
        String sql = """
                select
                    g.id as game_id,
                    g.white_player,
                    g.black_player,
                    g.result,
                    g.source,
                    g.source_url,
                    g.move_count,
                    g.event_name,
                    g.created_at::text as created_at,

                    ga.mode,

                    case
                        when ga.white_accuracy is not null
                         and ga.black_accuracy is not null
                            then (
                                ga.white_accuracy
                                + ga.black_accuracy
                            ) / 2.0
                        when ga.white_accuracy is not null
                            then ga.white_accuracy
                        else ga.black_accuracy
                    end as accuracy,

                    (
                        coalesce(ga.white_blunders, 0)
                        + coalesce(ga.black_blunders, 0)
                    ) as blunders,

                    (
                        coalesce(ga.white_mistakes, 0)
                        + coalesce(ga.black_mistakes, 0)
                    ) as mistakes

                from public.games g
                join public.game_analyses ga
                    on ga.game_id = g.id
                """ + whereClause + """
                order by g.created_at desc
                limit ?
                offset ?
                """;

        List<Object> queryParameters = new ArrayList<>(parameters);
        queryParameters.add(pageSize);
        queryParameters.add(offset);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                sql,
                queryParameters.toArray()
        );

        List<GameHistoryResponse.GameHistoryItemResponse> games =
                new ArrayList<>();

        for (Map<String, Object> row : rows) {
            games.add(
                    new GameHistoryResponse.GameHistoryItemResponse(
                            toUuid(row.get("game_id")),
                            stringValue(row.get("white_player")),
                            stringValue(row.get("black_player")),
                            stringValue(row.get("result")),
                            stringValue(row.get("source")),
                            stringValue(row.get("source_url")),
                            stringValue(row.get("mode")),
                            toDouble(row.get("accuracy")),
                            toInteger(row.get("blunders")),
                            toInteger(row.get("mistakes")),
                            toInteger(row.get("move_count")),
                            stringValue(row.get("event_name")),
                            stringValue(row.get("created_at"))
                    )
            );
        }

        return games;
    }

    private String normalizeSource(String source) {
        if (source == null || source.isBlank() || "all".equalsIgnoreCase(source)) {
            return null;
        }

        return switch (source.trim().toLowerCase(Locale.ROOT)) {
            case "pasted_pgn" -> "pasted_pgn";
            case "pgn_file" -> "pgn_file";
            case "lichess" -> "lichess";
            case "chesscom" -> "chesscom";
            case "manual" -> "manual";
            default -> null;
        };
    }

    private String normalizeMode(String mode) {
        if (mode == null || mode.isBlank() || "all".equalsIgnoreCase(mode)) {
            return null;
        }

        return switch (mode.trim().toLowerCase(Locale.ROOT)) {
            case "quick" -> "quick";
            case "standard" -> "standard";
            case "deep" -> "deep";
            default -> null;
        };
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }

        String normalized = search.trim().toLowerCase(Locale.ROOT);

        return normalized.isBlank() ? null : normalized;
    }

    private UUID toUuid(Object value) {
        if (value instanceof UUID uuid) {
            return uuid;
        }

        return UUID.fromString(String.valueOf(value));
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        return null;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }

        return null;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}