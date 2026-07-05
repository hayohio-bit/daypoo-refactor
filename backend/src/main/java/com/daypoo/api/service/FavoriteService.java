package com.daypoo.api.service;

import com.daypoo.api.entity.Favorite;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.FavoriteRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

  private final FavoriteRepository favoriteRepository;
  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;

  /** 즐겨찾기 토글 (추가/삭제) */
  @Transactional
  public boolean toggleFavorite(String email, Long toiletId) {
    User user = getUserByEmail(email);
    Toilet toilet = getToiletById(toiletId);

    return favoriteRepository
        .findByUserAndToilet(user, toilet)
        .map(
            favorite -> {
              favoriteRepository.delete(favorite);
              log.info("Removed toilet {} from favorites for user {}", toiletId, email);
              return false; // 삭제됨
            })
        .orElseGet(
            () -> {
              Favorite favorite = Favorite.builder().user(user).toilet(toilet).build();
              favoriteRepository.save(favorite);
              log.info("Added toilet {} to favorites for user {}", toiletId, email);
              return true; // 추가됨
            });
  }

  /** 내 즐겨찾기 화장실 ID 목록 조회 */
  @Transactional(readOnly = true)
  public List<Long> getFavoriteToiletIds(String email) {
    User user = getUserByEmail(email);
    return favoriteRepository.findToiletIdsByUser(user);
  }

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
  }

  private Toilet getToiletById(Long toiletId) {
    return toiletRepository
        .findById(toiletId)
        .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
  }
}
