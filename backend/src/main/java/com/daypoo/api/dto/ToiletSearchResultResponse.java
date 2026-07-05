package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record ToiletSearchResultResponse(
    Long id, String name, String address, double latitude, double longitude) {}
