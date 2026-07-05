package com.daypoo.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Builder;

@Builder
public record AiAnalysisResponse(
    @JsonProperty("is_poop") Boolean isPoop,
    @JsonProperty("bristol_scale") Integer bristolScale,
    String color,
    @JsonProperty("shape_description") String conditionTag,
    @JsonProperty("health_score") Integer healthScore,
    @JsonProperty("ai_comment") String aiComment,
    @JsonProperty("warning_tags") List<String> warningTags) {}
