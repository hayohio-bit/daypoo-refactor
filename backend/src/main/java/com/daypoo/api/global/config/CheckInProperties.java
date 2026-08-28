package com.daypoo.api.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** 화장실 체크인 정책값. */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.check-in")
public class CheckInProperties {

  /** 체크인을 허용하는 최대 거리(미터). GPS 음영 지역과 측위 오차를 고려한 값이다. */
  private double allowedRadiusMeters = 150.0;
}
