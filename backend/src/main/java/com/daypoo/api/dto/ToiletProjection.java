package com.daypoo.api.dto;

public interface ToiletProjection {
  Long getId();

  String getName();

  String getAddress();

  String getOpenHours();

  Boolean getIs24h();

  Double getLongitude();

  Double getLatitude();

  Double getDistance();
}
