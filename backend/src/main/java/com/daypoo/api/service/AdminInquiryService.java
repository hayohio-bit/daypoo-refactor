package com.daypoo.api.service;

import com.daypoo.api.dto.AdminInquiryAnswerRequest;
import com.daypoo.api.dto.AdminInquiryDetailResponse;
import com.daypoo.api.dto.AdminInquiryListResponse;
import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.InquiryStatus;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.entity.enums.NotificationType;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.InquiryRepository;
import com.daypoo.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자 전용 1:1 문의 조회·답변 및 문의 테스트 데이터 생성 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminInquiryService {

  private final InquiryRepository inquiryRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;

  @Transactional(readOnly = true)
  public Page<AdminInquiryListResponse> getInquiries(
      InquiryStatus status, String search, Pageable pageable) {
    log.info("Fetching inquiries - Status: {}, Search: {}, Pageable: {}", status, search, pageable);
    try {
      Page<Inquiry> inquiries;
      if (status != null) {
        if (search != null && !search.isBlank()) {
          inquiries = inquiryRepository.findByStatusAndSearch(status, search, pageable);
        } else {
          inquiries = inquiryRepository.findAllByStatus(status, pageable);
        }
      } else {
        if (search != null && !search.isBlank()) {
          inquiries = inquiryRepository.findBySearch(search, pageable);
        } else {
          inquiries = inquiryRepository.findAll(pageable);
        }
      }

      log.info(
          "Found {} inquiries in this page. Total elements: {}",
          inquiries.getContent().size(),
          inquiries.getTotalElements());

      return inquiries.map(
          i -> {
            try {
              return AdminInquiryListResponse.builder()
                  .id(i.getId())
                  .userName(i.getUser() != null ? i.getUser().getNickname() : "Unknown")
                  .userEmail(i.getUser() != null ? i.getUser().getEmail() : "Unknown")
                  .type(i.getType() != null ? i.getType().getLabel() : "Unknown")
                  .title(i.getTitle())
                  .status(i.getStatus())
                  .createdAt(i.getCreatedAt())
                  .build();
            } catch (Exception e) {
              log.error("Error mapping inquiry entity ID {}: {}", i.getId(), e.getMessage());
              return null;
            }
          });
    } catch (Exception e) {
      log.error("Error in getInquiries: {}", e.getMessage(), e);
      throw e;
    }
  }

  @Transactional(readOnly = true)
  public AdminInquiryDetailResponse getInquiryDetail(Long inquiryId) {
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_INQUIRY_NOT_FOUND));

    return AdminInquiryDetailResponse.builder()
        .id(inquiry.getId())
        .userName(inquiry.getUser().getNickname())
        .userEmail(inquiry.getUser().getEmail())
        .type(inquiry.getType().getLabel())
        .title(inquiry.getTitle())
        .content(inquiry.getContent())
        .answer(inquiry.getAnswer())
        .status(inquiry.getStatus())
        .createdAt(inquiry.getCreatedAt())
        .updatedAt(inquiry.getUpdatedAt())
        .build();
  }

  @Transactional
  public void answerInquiry(Long inquiryId, AdminInquiryAnswerRequest request) {
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_INQUIRY_NOT_FOUND));

    if (inquiry.getStatus() == InquiryStatus.COMPLETED) {
      throw new BusinessException(ErrorCode.ADMIN_INQUIRY_ALREADY_ANSWERED);
    }

    inquiry.answer(request.answer());

    notificationService.send(
        inquiry.getUser(),
        NotificationType.SYSTEM,
        "1:1 문의 답변이 도착했습니다.",
        "'" + inquiry.getTitle() + "' 문의에 대한 답변이 등록되었습니다.",
        "/support?tab=myinquiry");
  }

  /** 테스트용 사용자를 골라 30개의 문의 테스트 데이터를 생성한다. */
  @Transactional
  public void generateInquiryTestData() {
    // 테스트용 사용자 가져오기 (없으면 첫 번째 일반 사용자 사용)
    User testUser =
        userRepository
            .findByEmail("user1@daypoo.com")
            .or(() -> userRepository.findByEmail("user2@daypoo.com"))
            .orElseGet(
                () ->
                    userRepository.findAll().stream()
                        .filter(u -> u.getRole() != Role.ROLE_ADMIN)
                        .findFirst()
                        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)));

    generateInquiryTestData(testUser);
  }

  /** 지정한 사용자 명의로 30개의 문의 테스트 데이터를 생성한다. 3건 중 1건은 답변 완료 상태로 만든다. */
  private void generateInquiryTestData(User testUser) {
    log.info("Generating 30 inquiry test data for user: {}", testUser.getEmail());

    InquiryType[] types = InquiryType.values();
    String[] titles = {
      "앱 사용 중 오류가 발생합니다",
      "결제가 완료되지 않아요",
      "화장실 정보가 잘못되었어요",
      "포인트가 적립되지 않았습니다",
      "아이템 구매 후 인벤토리 확인이 안 돼요",
      "AI 분석 결과가 이상합니다",
      "지도에서 화장실이 표시되지 않아요",
      "리뷰 작성 후 반영이 안 됩니다",
      "랭킹 점수가 업데이트되지 않아요",
      "알림이 오지 않습니다"
    };

    for (int i = 0; i < 30; i++) {
      InquiryType type = types[i % types.length];
      String title = titles[i % titles.length] + " #" + (i + 1);
      String content =
          "문의 내용입니다. 테스트 데이터 "
              + (i + 1)
              + "번째 문의입니다.\n"
              + "상세한 설명을 여기에 작성합니다. 문제가 발생한 상황과 재현 방법을 알려주세요.";

      Inquiry inquiry =
          Inquiry.builder().user(testUser).type(type).title(title).content(content).build();

      inquiryRepository.save(inquiry);

      // 일부 문의는 답변 완료 상태로 설정
      if (i % 3 == 0) {
        inquiry.answer("테스트 답변입니다. 문의해 주셔서 감사합니다.\n" + "해당 문제는 확인되었으며, 조치 완료되었습니다.");
      }
    }

    log.info("Successfully generated 30 inquiry test data");
  }
}
