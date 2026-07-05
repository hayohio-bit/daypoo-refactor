package com.daypoo.api.service;

import com.daypoo.api.dto.FaqResponse;
import com.daypoo.api.dto.InquiryRequest;
import com.daypoo.api.dto.InquiryResponse;
import com.daypoo.api.entity.Faq;
import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.FaqRepository;
import com.daypoo.api.repository.InquiryRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class SupportService {

  private final InquiryRepository inquiryRepository;
  private final FaqRepository faqRepository;
  private final SystemLogService systemLogService;

  /** 1:1 문의 등록 */
  public void createInquiry(User user, InquiryRequest request) {
    Inquiry inquiry =
        Inquiry.builder()
            .user(user)
            .type(InquiryType.fromLabel(request.category()))
            .title(request.title())
            .content(request.content())
            .build();
    inquiryRepository.save(inquiry);
    systemLogService.info("Support", "New inquiry received: " + request.title());
  }

  /** 내 문의 내역 조회 */
  @Transactional(readOnly = true)
  public List<InquiryResponse> getMyInquiries(User user) {
    return inquiryRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
        .map(
            i ->
                InquiryResponse.builder()
                    .id(i.getId())
                    .category(i.getType().getLabel())
                    .title(i.getTitle())
                    .content(i.getContent())
                    .answer(i.getAnswer())
                    .status(i.getStatus().getLabel())
                    .createdAt(i.getCreatedAt())
                    .build())
        .collect(Collectors.toList());
  }

  /** 문의 삭제 (사용자 본인 확인) */
  public void deleteInquiry(User user, Long inquiryId) {
    if (inquiryId == null) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_INQUIRY_NOT_FOUND));

    if (!java.util.Objects.equals(inquiry.getUser().getId(), user.getId())) {
      throw new BusinessException(ErrorCode.HANDLE_ACCESS_DENIED);
    }

    inquiryRepository.delete(inquiry);
    systemLogService.info("Support", "Inquiry deleted by user: " + inquiryId);
  }

  /** 문의 수정 (사용자 본인 확인) */
  public void updateInquiry(User user, Long inquiryId, InquiryRequest request) {
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_INQUIRY_NOT_FOUND));

    if (!java.util.Objects.equals(inquiry.getUser().getId(), user.getId())) {
      throw new BusinessException(ErrorCode.HANDLE_ACCESS_DENIED);
    }

    if (inquiry.getAnswer() != null) {
      throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE); // 답변된 문의는 수정 불가
    }

    inquiry.update(request.title(), request.content(), InquiryType.fromLabel(request.category()));

    inquiryRepository.save(inquiry);
    systemLogService.info("Support", "Inquiry updated by user: " + inquiryId);
  }

  /** 카테고리별 FAQ 조회 */
  @Transactional(readOnly = true)
  public List<FaqResponse> getFaqs(String category) {
    List<Faq> faqs =
        (category == null || category.isEmpty())
            ? faqRepository.findAll()
            : faqRepository.findAllByCategoryOrderByCreatedAtDesc(category);

    return faqs.stream()
        .map(
            f ->
                FaqResponse.builder()
                    .id(f.getId())
                    .category(f.getCategory())
                    .question(f.getQuestion())
                    .answer(f.getAnswer())
                    .build())
        .collect(Collectors.toList());
  }
}
