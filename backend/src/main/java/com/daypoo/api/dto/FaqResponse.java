package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record FaqResponse(Long id, String category, String question, String answer) {}
