package com.daypoo.api.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Properties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

/**
 * 운영 프로파일 설정 파일의 보안상 중요한 키를 고정한다. 보안 필터 체인 테스트는 경로 규칙만 보므로, 헬스체크 상세 노출 같은 설정값은 여기서 확인한다. 설정 파일을 직접
 * 읽으므로 애플리케이션 컨텍스트나 외부 시스템이 필요 없다.
 */
@DisplayName("운영 프로파일 설정")
class ProductionConfigTest {

  private Properties prodProperties() {
    YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
    yaml.setResources(new ClassPathResource("application-prod.yml"));
    return yaml.getObject();
  }

  @Test
  @DisplayName("헬스체크 상세는 관리자에게만 보인다")
  void healthDetailsAreAdminOnly() {
    Properties props = prodProperties();

    // 기본 설정(application.yml)은 로컬 개발 편의로 always 이므로, 운영에서 반드시 덮어써야 한다
    assertThat(props.getProperty("management.endpoint.health.show-details"))
        .isEqualTo("when-authorized");
    assertThat(props.getProperty("management.endpoint.health.roles")).isEqualTo("ADMIN");
  }
}
