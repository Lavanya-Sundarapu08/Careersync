package com.careersync.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;

@Configuration
public class AsyncConfig {

    /**
     * Backs @Async listeners (notifications, audit logging) with virtual threads so
     * the event-driven fan-out never blocks the main HTTP request thread nor exhausts
     * a fixed platform-thread pool under burst load.
     */
    @Bean(name = "applicationTaskExecutor")
    public TaskExecutor applicationTaskExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("careersync-vt-");
        executor.setVirtualThreads(true);
        return executor;
    }
}
