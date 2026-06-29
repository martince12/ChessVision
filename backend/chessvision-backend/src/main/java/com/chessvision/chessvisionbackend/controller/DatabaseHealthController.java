package com.chessvision.chessvisionbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

@RestController
@RequestMapping("/api/database")
public class DatabaseHealthController {

    private final DataSource dataSource;

    public DatabaseHealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> pingDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            String databaseName =
                    connection.getMetaData().getDatabaseProductName();

            return ResponseEntity.ok(
                    Map.of(
                            "status", "ok",
                            "message",
                            "Supabase database connection is working",
                            "database", databaseName
                    )
            );

        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "status", "error",
                            "message",
                            "Could not connect to Supabase database: "
                                    + exception.getMessage()
                    )
            );
        }
    }
}