package com.daypoo.api.service;

import com.daypoo.api.dto.ToiletProjection;
import com.daypoo.api.dto.ToiletResponse;
import com.daypoo.api.mapper.ToiletMapper;
import com.daypoo.api.repository.ToiletRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ToiletService {

  private final ToiletRepository toiletRepository;
  private final ToiletMapper toiletMapper;

  @Transactional(readOnly = true)
  public List<ToiletResponse> searchToilets(
      double latitude, double longitude, double radius, int limit) {
    List<ToiletProjection> results =
        toiletRepository.findToiletsWithinRadius(latitude, longitude, radius, limit);
    return results.stream().map(toiletMapper::toResponse).collect(Collectors.toList());
  }
}
