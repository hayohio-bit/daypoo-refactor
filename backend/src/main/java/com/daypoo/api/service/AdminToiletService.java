package com.daypoo.api.service;

import com.daypoo.api.dto.AdminToiletListResponse;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.repository.ToiletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자 전용 화장실 데이터 조회 */
@Service
@RequiredArgsConstructor
public class AdminToiletService {

  private final ToiletRepository toiletRepository;

  @Transactional(readOnly = true)
  public Page<AdminToiletListResponse> getToilets(String search, Pageable pageable) {
    Page<Toilet> toilets;
    if (search != null && !search.isBlank()) {
      toilets = toiletRepository.findByNameContainingOrAddressContaining(search, search, pageable);
    } else {
      toilets = toiletRepository.findAll(pageable);
    }

    return toilets.map(
        t ->
            AdminToiletListResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .mngNo(t.getMngNo())
                .address(t.getAddress())
                .openHours(t.getOpenHours())
                .is24h(t.is24h())
                .isUnisex(t.isUnisex())
                .latitude(t.getLocation() != null ? t.getLocation().getY() : 0)
                .longitude(t.getLocation() != null ? t.getLocation().getX() : 0)
                .createdAt(t.getCreatedAt())
                .build());
  }
}
