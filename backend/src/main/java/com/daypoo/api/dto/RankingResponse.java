package com.daypoo.api.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record RankingResponse(
    List<UserRankResponse> topRankers, UserRankResponse myRank, long activeUserCount) {}
