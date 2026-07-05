package com.daypoo.api.dto;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record SystemLogResponse(
    Long id,
    String level, // INFO, WARN, ERROR
    String source, // Auth, Payment, AI, System
    String message,
    LocalDateTime timestamp) {}
