package com.careersync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class CareerSyncApplication {
    public static void main(String[] args) {
        SpringApplication.run(CareerSyncApplication.class, args);
    }
}
