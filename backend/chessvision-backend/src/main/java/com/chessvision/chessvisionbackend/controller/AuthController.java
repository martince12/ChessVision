package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.service.SupabaseAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SupabaseAuthService supabaseAuthService;

    public AuthController(
            SupabaseAuthService supabaseAuthService
    ) {
        this.supabaseAuthService = supabaseAuthService;
    }

    @GetMapping("/me")
    public Map<String, String> getCurrentUser(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorizationHeader
    ) {
        AuthenticatedUser user =
                supabaseAuthService.requireAuthenticatedUser(
                        authorizationHeader
                );

        Map<String, String> response = new LinkedHashMap<>();

        response.put("id", user.id().toString());
        response.put("email", user.email());
        response.put("displayName", user.displayName());

        return response;
    }
}