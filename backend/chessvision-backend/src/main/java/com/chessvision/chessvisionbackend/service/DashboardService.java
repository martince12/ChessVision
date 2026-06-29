package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.DashboardResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardResponse getDashboard(
            UUID userId,
            String displayName
    ) {
        OverviewMetrics overview = loadOverview(userId);

        List<Double> accuracyTrend = loadAccuracyTrend(userId);

        DashboardResponse.FocusAreaResponse focusArea =
                loadFocusArea(userId, overview.averageBlunders());

        List<DashboardResponse.RecentGameResponse> recentGames =
                loadRecentGames(userId, displayName);

        PerformanceRange performanceRange =
                calculatePerformanceRange(
                        overview.averageAccuracy(),
                        overview.averageCentipawnLoss(),
                        overview.totalGames()
                );

        return new DashboardResponse(
                overview.totalGames(),
                overview.averageAccuracy(),
                overview.averageBlunders(),
                performanceRange.lower(),
                performanceRange.upper(),
                accuracyTrend,
                focusArea,
                recentGames
        );
    }

    private OverviewMetrics loadOverview(UUID userId) {
        String sql = """
                select
                    count(*) as total_games,

                    avg(
                        case
                            when ga.white_accuracy is not null
                             and ga.black_accuracy is not null
                                then (ga.white_accuracy + ga.black_accuracy) / 2.0
                            when ga.white_accuracy is not null
                                then ga.white_accuracy
                            else ga.black_accuracy
                        end
                    ) as average_accuracy,

                    avg(
                        coalesce(ga.white_blunders, 0)
                        + coalesce(ga.black_blunders, 0)
                    ) as average_blunders,

                    avg(
                        case
                            when ga.white_average_cpl is not null
                             and ga.black_average_cpl is not null
                                then (
                                    ga.white_average_cpl
                                    + ga.black_average_cpl
                                ) / 2.0
                            when ga.white_average_cpl is not null
                                then ga.white_average_cpl
                            else ga.black_average_cpl
                        end
                    ) as average_cpl

                from public.games g
                join public.game_analyses ga
                    on ga.game_id = g.id
                where g.user_id = ?
                  and ga.status = 'completed'
                """;

        Map<String, Object> row = jdbcTemplate.queryForMap(sql, userId);

        return new OverviewMetrics(
                toInt(row.get("total_games")),
                toDouble(row.get("average_accuracy")),
                toDouble(row.get("average_blunders")),
                toDouble(row.get("average_cpl"))
        );
    }

    private List<Double> loadAccuracyTrend(UUID userId) {
        String sql = """
                select accuracy
                from (
                    select
                        case
                            when ga.white_accuracy is not null
                             and ga.black_accuracy is not null
                                then (ga.white_accuracy + ga.black_accuracy) / 2.0
                            when ga.white_accuracy is not null
                                then ga.white_accuracy
                            else ga.black_accuracy
                        end as accuracy,

                        g.created_at

                    from public.games g
                    join public.game_analyses ga
                        on ga.game_id = g.id
                    where g.user_id = ?
                      and ga.status = 'completed'
                    order by g.created_at desc
                    limit 12
                ) as latest_games
                where accuracy is not null
                order by created_at asc
                """;

        List<Map<String, Object>> rows =
                jdbcTemplate.queryForList(sql, userId);

        List<Double> values = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Double accuracy = toDouble(row.get("accuracy"));

            if (accuracy != null) {
                values.add(accuracy);
            }
        }

        return values;
    }

    private DashboardResponse.FocusAreaResponse loadFocusArea(
            UUID userId,
            Double averageBlunders
    ) {
        String sql = """
                select
                    case
                        when ma.move_number <= 10 then 'Opening'
                        when ma.move_number <= 25 then 'Middlegame'
                        else 'Endgame'
                    end as phase,

                    avg(coalesce(ma.centipawn_loss, 0)) as average_cpl

                from public.move_analyses ma
                join public.game_analyses ga
                    on ga.id = ma.analysis_id
                join public.games g
                    on g.id = ga.game_id
                where g.user_id = ?
                  and ga.status = 'completed'
                group by 1
                """;

        List<Map<String, Object>> rows =
                jdbcTemplate.queryForList(sql, userId);

        if (rows.isEmpty()) {
            return new DashboardResponse.FocusAreaResponse(
                    "Middlegame",
                    "Opening",
                    null,
                    0,
                    2
            );
        }

        List<PhaseMetric> phases = rows.stream()
                .map(row -> new PhaseMetric(
                        String.valueOf(row.get("phase")),
                        toDouble(row.get("average_cpl"))
                ))
                .toList();

        PhaseMetric weakestPhase = phases.stream()
                .max(
                        Comparator.comparing(
                                phase -> phase.averageCpl() == null
                                        ? 0.0
                                        : phase.averageCpl()
                        )
                )
                .orElse(phases.get(0));

        PhaseMetric strongestPhase = phases.stream()
                .min(
                        Comparator.comparing(
                                phase -> phase.averageCpl() == null
                                        ? Double.MAX_VALUE
                                        : phase.averageCpl()
                        )
                )
                .orElse(phases.get(0));

        double focusCpl = weakestPhase.averageCpl() == null
                ? 0.0
                : weakestPhase.averageCpl();

        int score = (int) Math.round(
                Math.max(0, Math.min(100, 100 - focusCpl))
        );

        int suggestedBlunderGoal = averageBlunders == null
                ? 2
                : Math.max(1, (int) Math.floor(averageBlunders));

        return new DashboardResponse.FocusAreaResponse(
                weakestPhase.phase(),
                strongestPhase.phase(),
                weakestPhase.averageCpl(),
                score,
                suggestedBlunderGoal
        );
    }

    private List<DashboardResponse.RecentGameResponse> loadRecentGames(
            UUID userId,
            String displayName
    ) {
        String sql = """
                select
                    g.id,
                    g.white_player,
                    g.black_player,
                    g.result,
                    g.created_at::text as created_at,

                    case
                        when ga.white_accuracy is not null
                         and ga.black_accuracy is not null
                            then (ga.white_accuracy + ga.black_accuracy) / 2.0
                        when ga.white_accuracy is not null
                            then ga.white_accuracy
                        else ga.black_accuracy
                    end as accuracy,

                    (
                        coalesce(ga.white_blunders, 0)
                        + coalesce(ga.black_blunders, 0)
                    ) as blunders

                from public.games g
                join public.game_analyses ga
                    on ga.game_id = g.id
                where g.user_id = ?
                  and ga.status = 'completed'
                order by g.created_at desc
                limit 8
                """;

        List<Map<String, Object>> rows =
                jdbcTemplate.queryForList(sql, userId);

        List<DashboardResponse.RecentGameResponse> games =
                new ArrayList<>();

        for (Map<String, Object> row : rows) {
            String whitePlayer = stringValue(row.get("white_player"));
            String blackPlayer = stringValue(row.get("black_player"));

            String playedAs = determinePlayedAs(
                    displayName,
                    whitePlayer,
                    blackPlayer
            );

            String opponent = determineOpponent(
                    playedAs,
                    whitePlayer,
                    blackPlayer
            );

            games.add(new DashboardResponse.RecentGameResponse(
                    UUID.fromString(String.valueOf(row.get("id"))),
                    opponent,
                    playedAs,
                    determineResult(
                            stringValue(row.get("result")),
                            playedAs
                    ),
                    toDouble(row.get("accuracy")),
                    toInt(row.get("blunders")),
                    stringValue(row.get("created_at"))
            ));
        }

        return games;
    }

    private PerformanceRange calculatePerformanceRange(
            Double averageAccuracy,
            Double averageCentipawnLoss,
            int totalGames
    ) {
        if (totalGames == 0 || averageAccuracy == null) {
            return new PerformanceRange(null, null);
        }

        double cplPenalty = averageCentipawnLoss == null
                ? 0
                : Math.min(160, averageCentipawnLoss) * 0.45;

        double estimatedCenter =
                700 + (averageAccuracy * 11.5) - cplPenalty;

        estimatedCenter = Math.max(
                800,
                Math.min(2500, estimatedCenter)
        );

        int roundedCenter =
                (int) Math.round(estimatedCenter / 50.0) * 50;

        return new PerformanceRange(
                roundedCenter - 100,
                roundedCenter + 100
        );
    }

    private String determinePlayedAs(
            String displayName,
            String whitePlayer,
            String blackPlayer
    ) {
        if (matchesPlayer(displayName, whitePlayer)) {
            return "White";
        }

        if (matchesPlayer(displayName, blackPlayer)) {
            return "Black";
        }

        return "Unknown";
    }

    private String determineOpponent(
            String playedAs,
            String whitePlayer,
            String blackPlayer
    ) {
        if ("White".equals(playedAs)) {
            return blankFallback(blackPlayer, "Unknown opponent");
        }

        if ("Black".equals(playedAs)) {
            return blankFallback(whitePlayer, "Unknown opponent");
        }

        return blankFallback(
                whitePlayer + " vs " + blackPlayer,
                "Unknown game"
        );
    }

    private String determineResult(
            String pgnResult,
            String playedAs
    ) {
        if ("1/2-1/2".equals(pgnResult)) {
            return "Draw";
        }

        if ("*".equals(pgnResult) || pgnResult == null) {
            return "Unfinished";
        }

        if ("White".equals(playedAs)) {
            return "1-0".equals(pgnResult) ? "Win" : "Loss";
        }

        if ("Black".equals(playedAs)) {
            return "0-1".equals(pgnResult) ? "Win" : "Loss";
        }

        return "Unknown";
    }

    private boolean matchesPlayer(
            String displayName,
            String playerName
    ) {
        String normalizedUser = normalizeName(displayName);
        String normalizedPlayer = normalizeName(playerName);

        if (normalizedUser.isBlank() || normalizedPlayer.isBlank()) {
            return false;
        }

        return normalizedUser.equals(normalizedPlayer)
                || (
                normalizedPlayer.length() >= 4
                        && normalizedUser.contains(normalizedPlayer)
        )
                || (
                normalizedUser.length() >= 4
                        && normalizedPlayer.contains(normalizedUser)
        );
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }

        return value
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    private String blankFallback(
            String value,
            String fallback
    ) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        return value;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        return 0;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }

        return null;
    }

    private record OverviewMetrics(
            int totalGames,
            Double averageAccuracy,
            Double averageBlunders,
            Double averageCentipawnLoss
    ) {
    }

    private record PhaseMetric(
            String phase,
            Double averageCpl
    ) {
    }

    private record PerformanceRange(
            Integer lower,
            Integer upper
    ) {
    }
}