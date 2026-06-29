package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.AccountProfileResponse;
import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.dto.UpdateAccountProfileRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class AccountProfileService {

    private final JdbcTemplate jdbcTemplate;

    public AccountProfileService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AccountProfileResponse getProfile(
            AuthenticatedUser authenticatedUser
    ) {
        String sql = """
                select
                    id,
                    username,
                    display_name
                from public.profiles
                where id = ?
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                sql,
                authenticatedUser.id()
        );

        if (rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Your ChessVision profile could not be found."
            );
        }

        Map<String, Object> profile = rows.get(0);

        return new AccountProfileResponse(
                authenticatedUser.id(),
                authenticatedUser.email(),
                stringValue(profile.get("username")),
                stringValue(profile.get("display_name"))
        );
    }

    @Transactional
    public AccountProfileResponse updateProfile(
            AuthenticatedUser authenticatedUser,
            UpdateAccountProfileRequest request
    ) {
        String username = request.username().trim();
        String displayName = request.displayName().trim();

        String sql = """
                update public.profiles
                set
                    username = ?,
                    display_name = ?,
                    updated_at = current_timestamp
                where id = ?
                """;

        try {
            int updatedRows = jdbcTemplate.update(
                    sql,
                    username,
                    displayName,
                    authenticatedUser.id()
            );

            if (updatedRows == 0) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Your ChessVision profile could not be found."
                );
            }

        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This username is already taken."
            );
        }

        return new AccountProfileResponse(
                authenticatedUser.id(),
                authenticatedUser.email(),
                username,
                displayName
        );
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}