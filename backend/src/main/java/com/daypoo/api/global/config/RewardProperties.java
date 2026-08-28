package com.daypoo.api.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** 기록 작성 보상 정책값. */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.reward")
public class RewardProperties {

  /** 배변 기록 1건당 지급하는 경험치. */
  private int recordExp = 5;
}
