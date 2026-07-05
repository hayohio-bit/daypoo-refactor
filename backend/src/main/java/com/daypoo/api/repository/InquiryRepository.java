package com.daypoo.api.repository;

import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.InquiryStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
  List<Inquiry> findAllByUserOrderByCreatedAtDesc(User user);

  java.util.Optional<Inquiry> findByIdAndUser(Long id, User user);

  Page<Inquiry> findAllByStatus(InquiryStatus status, Pageable pageable);

  Page<Inquiry> findByUserId(Long userId, Pageable pageable);

  @org.springframework.data.jpa.repository.Query(
      "SELECT i FROM Inquiry i WHERE i.title LIKE %:search% OR i.user.email LIKE %:search% OR i.user.nickname LIKE %:search%")
  Page<Inquiry> findBySearch(String search, Pageable pageable);

  @org.springframework.data.jpa.repository.Query(
      "SELECT i FROM Inquiry i WHERE i.status = :status AND (i.title LIKE %:search% OR i.user.email LIKE %:search% OR i.user.nickname LIKE %:search%)")
  Page<Inquiry> findByStatusAndSearch(InquiryStatus status, String search, Pageable pageable);

  long countByStatus(InquiryStatus status);

  long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

  void deleteAllByUser(User user);
}
