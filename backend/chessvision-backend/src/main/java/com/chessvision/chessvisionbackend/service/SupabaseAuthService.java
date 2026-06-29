package com.chessvision.chessvisionbackend.service;

import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

@Service
public class SupabaseAuthService {

    private static final Duration REQUEST_TIMEOUT =
            Duration.ofSeconds(10);

    private final JsonMapper jsonMapper;
    private final HttpClient httpClient;
    private final String supabaseUrl;
    private final String supabasePublishableKey;

    public SupabaseAuthService(
            JsonMapper jsonMapper,
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.publishable-key}") String supabasePublishableKey
    ) {
        this.jsonMapper = jsonMapper;
        this.supabaseUrl = removeTrailingSlash(supabaseUrl);
        this.supabasePublishableKey = supabasePublishableKey;

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public AuthenticatedUser requireAuthenticatedUser(
            String authorizationHeader
    ) {
        String accessToken = extractBearerToken(authorizationHeader);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + "/auth/v1/user"))
                .timeout(REQUEST_TIMEOUT)
                .header("apikey", supabasePublishableKey)
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", "application/json")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Your session is invalid or has expired. Please log in again."
                );
            }

            JsonNode userJson = jsonMapper.readTree(response.body());

            String rawUserId = userJson.path("id").asText();

            if (rawUserId == null || rawUserId.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Supabase did not return a valid user."
                );
            }

            String email = userJson.path("email").asText("");

            String displayName = userJson
                    .path("user_metadata")
                    .path("display_name")
                    .asText("");

            if (displayName.isBlank()) {
                displayName = userJson
                        .path("user_metadata")
                        .path("username")
                        .asText("");
            }

            return new AuthenticatedUser(
                    UUID.fromString(rawUserId),
                    email,
                    displayName
            );

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify your session with Supabase."
            );

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Session verification was interrupted."
            );

        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Supabase returned an invalid user identity."
            );
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (
                authorizationHeader == null
                        || !authorizationHeader.startsWith("Bearer ")
        ) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Missing authentication token."
            );
        }

        String token = authorizationHeader
                .substring("Bearer ".length())
                .trim();

        if (token.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Missing authentication token."
            );
        }

        return token;
    }

    private String removeTrailingSlash(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("/+$", "");
    }
}