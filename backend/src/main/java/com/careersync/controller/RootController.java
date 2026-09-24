package com.careersync.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
            "app", "CareerSync API",
            "status", "ONLINE",
            "version", "1.0.0",
            "message", "CareerSync Spring Boot backend is healthy and running."
        ));
    }
}
