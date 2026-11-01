package com.daypoo.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@DisplayName("방문 로그 저장기 테스트")
class VisitLogRecorderTest {

  @Test
  @DisplayName("실패 로그용 저장은 호출 트랜잭션과 무관한 REQUIRES_NEW 이다")
  void saveInNewTransaction_requiresNew() throws Exception {
    Method method =
        VisitLogRecorder.class.getMethod("saveInNewTransaction", VisitLogRecorder.Entry.class);

    assertThat(method.getAnnotation(Transactional.class).propagation())
        .isEqualTo(Propagation.REQUIRES_NEW);
  }

  @Test
  @DisplayName("성공 로그용 저장은 호출 트랜잭션에 참여한다")
  void save_joinsCallerTransaction() throws Exception {
    Method method = VisitLogRecorder.class.getMethod("save", VisitLogRecorder.Entry.class);

    assertThat(method.getAnnotation(Transactional.class).propagation())
        .isEqualTo(Propagation.REQUIRED);
  }

  @Test
  @DisplayName("실패 로그 저장은 호출 스레드가 두 번째 커넥션을 기다리지 않도록 비동기로 실행된다")
  void saveInNewTransaction_isAsync() throws Exception {
    Method method =
        VisitLogRecorder.class.getMethod("saveInNewTransaction", VisitLogRecorder.Entry.class);

    assertThat(method.isAnnotationPresent(Async.class)).isTrue();
  }
}
