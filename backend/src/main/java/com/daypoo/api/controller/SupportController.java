package com.daypoo.api.controller;

import com.daypoo.api.dto.FaqResponse;
import com.daypoo.api.dto.InquiryRequest;
import com.daypoo.api.entity.User;
import com.daypoo.api.service.SupportService;
import com.daypoo.api.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportController {

  private final SupportService supportService;
  private final UserService userService;

  /** 1:1 문의 등록 */
  @PostMapping("/inquiries")
  public ResponseEntity<Void> createInquiry(
      @AuthenticationPrincipal String email, @RequestBody InquiryRequest request) {
    User user = userService.getByEmail(email);
    supportService.createInquiry(user, request);
    return ResponseEntity.ok().build();
  }

  /** 내 문의 내역 조회 */
  @GetMapping("/inquiries")
  public ResponseEntity<List<?>> getMyInquiries(@AuthenticationPrincipal String email) {
    User user = userService.getByEmail(email);
    return ResponseEntity.ok(supportService.getMyInquiries(user));
  }

  /** 내 문의 삭제 */
  @DeleteMapping("/inquiries/{id}")
  public ResponseEntity<Void> deleteInquiry(
      java.security.Principal principal, @PathVariable("id") Long id) {
    if (principal == null) return ResponseEntity.status(401).build();
    User user = userService.getByEmail(principal.getName());
    supportService.deleteInquiry(user, id);
    return ResponseEntity.ok().build();
  }

  /** 내 문의 수정 */
  @PutMapping("/inquiries/{id}")
  public ResponseEntity<Void> updateInquiry(
      java.security.Principal principal,
      @PathVariable("id") Long id,
      @RequestBody InquiryRequest request) {
    if (principal == null) return ResponseEntity.status(401).build();
    User user = userService.getByEmail(principal.getName());
    supportService.updateInquiry(user, id, request);
    return ResponseEntity.ok().build();
  }

  /** FAQ 조회 */
  @GetMapping("/faqs")
  public ResponseEntity<List<FaqResponse>> getFaqs(
      @RequestParam(required = false) String category) {
    return ResponseEntity.ok(supportService.getFaqs(category));
  }
}
