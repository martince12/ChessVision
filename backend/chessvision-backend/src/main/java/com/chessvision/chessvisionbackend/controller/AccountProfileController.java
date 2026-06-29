package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.AccountProfileResponse;
import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.dto.UpdateAccountProfileRequest;
import com.chessvision.chessvisionbackend.service.AccountProfileService;
import com.chessvision.chessvisionbackend.service.SupabaseAuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountProfileController {

    private final AccountProfileService accountProfileService;
    private final SupabaseAuthService supabaseAuthService;

    public AccountProfileController(
            AccountProfileService accountProfileService,
            SupabaseAuthService supabaseAuthService
    ) {
        this.accountProfileService = accountProfileService;
        this.supabaseAuthService = supabaseAuthService;
    }

    @GetMapping("/profile")
    public AccountProfileResponse getProfile(
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

        return accountProfileService.getProfile(user);
    }

    @PutMapping("/profile")
    public AccountProfileResponse updateProfile(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorizationHeader,

            @Valid @RequestBody UpdateAccountProfileRequest request
    ) {
        AuthenticatedUser user =
                supabaseAuthService.requireAuthenticatedUser(
                        authorizationHeader
                );

        return accountProfileService.updateProfile(user, request);
    }
}