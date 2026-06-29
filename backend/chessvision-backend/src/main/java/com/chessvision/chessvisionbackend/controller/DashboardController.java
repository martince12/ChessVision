package com.chessvision.chessvisionbackend.controller;

import com.chessvision.chessvisionbackend.dto.AuthenticatedUser;
import com.chessvision.chessvisionbackend.dto.DashboardResponse;
import com.chessvision.chessvisionbackend.service.DashboardService;
import com.chessvision.chessvisionbackend.service.SupabaseAuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final SupabaseAuthService supabaseAuthService;

    public DashboardController(
            DashboardService dashboardService,
            SupabaseAuthService supabaseAuthService
    ) {
        this.dashboardService = dashboardService;
        this.supabaseAuthService = supabaseAuthService;
    }

    @GetMapping
    public DashboardResponse getDashboard(
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

        return dashboardService.getDashboard(
                user.id(),
                user.displayName()
        );
    }
}