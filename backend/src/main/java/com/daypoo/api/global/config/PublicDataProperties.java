package com.daypoo.api.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** 공공데이터포털 화장실 API 연동 설정. */
@Getter
@Setter
@ConfigurationProperties(prefix = "public-data")
public class PublicDataProperties {

  /** 공공데이터포털 서비스 키. */
  private String apiKey;

  /** API 기본 URL. */
  private String url;

  /** 한 번의 API 호출로 받아오는 행 수. */
  private int batchSize = 100;

  /** 동시에 실행하는 최대 API 호출 수. */
  private int maxConcurrentRequests = 10;
}
