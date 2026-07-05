package com.daypoo.api.global.config;

import java.time.Duration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableRetry
public class ExternalApiConfig {

  /** 외부 API 호출 전용 RestTemplate (타임아웃 설정 포함) */
  @Bean(name = "externalRestTemplate")
  public RestTemplate externalRestTemplate(RestTemplateBuilder builder) {
    return builder
        .requestFactory(
            () -> {
              var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
              factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
              factory.setReadTimeout((int) Duration.ofSeconds(30).toMillis());
              return factory;
            })
        .build();
  }
}
