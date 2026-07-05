package com.daypoo.api.service;

import com.daypoo.api.dto.NotificationResponse;
import com.daypoo.api.entity.Notification;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final StringRedisTemplate redisTemplate;
  private final RedisMessageListenerContainer redisMessageListenerContainer;
  private final ObjectMapper objectMapper;

  // 유저별 SSE Emitter 관리 (로컬 메모리 저장소)
  private final Map<Long, SseEmitter> localEmitters = new ConcurrentHashMap<>();

  /** Redis Pub/Sub 구독 설정 */
  @PostConstruct
  public void init() {
    redisMessageListenerContainer.addMessageListener(
        (message, pattern) -> {
          try {
            String content = new String(message.getBody());
            NotificationResponse response =
                objectMapper.readValue(content, NotificationResponse.class);
            // 모든 로컬 인스턴스에서 해당 유저의 Emitter가 있는지 확인 후 전송
            sendToLocal(response.userId(), response);
          } catch (Exception e) {
            log.error("Error processing Redis message: {}", e.getMessage());
          }
        },
        new ChannelTopic("notifications"));
  }

  /** SSE 연결 수립 */
  public SseEmitter subscribe(Long userId) {
    SseEmitter emitter = new SseEmitter(60L * 1000 * 60); // 1시간 타임아웃
    localEmitters.put(userId, emitter);
    log.info(
        "New SSE subscription for user: {}. Total active emitters: {}",
        userId,
        localEmitters.size());

    emitter.onCompletion(() -> removeEmitter(userId, "completion"));
    emitter.onTimeout(() -> removeEmitter(userId, "timeout"));
    emitter.onError((e) -> removeEmitter(userId, "error: " + e.getMessage()));

    // 연결 시 더미 이벤트 전송 (연결 확인용)
    try {
      emitter.send(SseEmitter.event().name("connect").data("connected!"));
    } catch (IOException e) {
      removeEmitter(userId, "initial send failure");
    }

    return emitter;
  }

  /** 알림 생성 및 실시간 전송 */
  @Transactional
  public void send(
      User user, NotificationType type, String title, String content, String redirectUrl) {
    Notification notification =
        Notification.builder()
            .user(user)
            .type(type)
            .title(title)
            .content(content)
            .redirectUrl(redirectUrl)
            .build();

    notificationRepository.save(notification);

    // Redis Pub/Sub 발행 (분산 환경 대응)
    NotificationResponse response =
        NotificationResponse.builder()
            .id(notification.getId())
            .userId(user.getId()) // UserId 포함 필드 필요 (DTO에 추가 예정)
            .type(notification.getType())
            .title(notification.getTitle())
            .content(notification.getContent())
            .redirectUrl(notification.getRedirectUrl())
            .isRead(notification.isRead())
            .createdAt(notification.getCreatedAt())
            .build();

    try {
      redisTemplate.convertAndSend("notifications", objectMapper.writeValueAsString(response));
    } catch (Exception e) {
      log.error("Failed to publish notification to Redis: {}", e.getMessage());
      // Redis 장애 시에도 로컬 인스턴스에는 즉시 전송 시도
      sendToLocal(user.getId(), response);
    }
  }

  /** 로컬 메모리의 Emitter를 통해 실시간 전송 */
  private void sendToLocal(Long userId, NotificationResponse response) {
    SseEmitter emitter = localEmitters.get(userId);
    if (emitter != null) {
      try {
        emitter.send(SseEmitter.event().name("notification").data(response));
        log.debug("Notification sent to local user: {}", userId);
      } catch (Exception e) {
        removeEmitter(userId, "send failure: " + e.getMessage());
      }
    }
  }

  private void removeEmitter(Long userId, String reason) {
    if (localEmitters.remove(userId) != null) {
      log.info(
          "SSE emitter removed for user: {} (Reason: {}). Remaining emitters: {}",
          userId,
          reason,
          localEmitters.size());
    }
  }

  /** 내 알림 목록 조회 */
  @Transactional(readOnly = true)
  public List<NotificationResponse> getMyNotifications(User user) {
    return notificationRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
        .map(
            n ->
                NotificationResponse.builder()
                    .id(n.getId())
                    .userId(user.getId())
                    .type(n.getType())
                    .title(n.getTitle())
                    .content(n.getContent())
                    .redirectUrl(n.getRedirectUrl())
                    .isRead(n.isRead())
                    .createdAt(n.getCreatedAt())
                    .build())
        .collect(Collectors.toList());
  }

  /** 알림 읽음 처리 */
  @Transactional
  public void markAsRead(Long notificationId) {
    Notification notification =
        notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
    notification.markAsRead();
  }

  /** 모든 알림 일괄 읽음 처리 */
  @Transactional
  public void markAllAsRead(User user) {
    List<Notification> notifications = notificationRepository.findAllByUserAndIsReadFalse(user);
    notifications.forEach(Notification::markAsRead);
  }

  /** 알림 삭제 (본인 확인) */
  @Transactional
  public void deleteNotification(Long notificationId, User user) {
    Notification notification =
        notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

    // 본인의 알림인지 확인
    if (!notification.getUser().getId().equals(user.getId())) {
      throw new BusinessException(ErrorCode.HANDLE_ACCESS_DENIED);
    }

    notificationRepository.delete(notification);
  }
}
