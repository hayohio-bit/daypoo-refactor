package com.daypoo.api.dto;

import org.springframework.beans.factory.annotation.Value;

public interface ToiletProjection {
  Long getId();

  String getName();

  String getAddress();

  @Value("#{target.open_hours}")
  String getOpenHours();

  @Value("#{target.is_24h}")
  Boolean getIs24h();

  Double getLongitude();

  Double getLatitude();

  Double getDistance();
}
