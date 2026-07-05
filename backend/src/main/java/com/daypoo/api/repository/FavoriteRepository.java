package com.daypoo.api.repository;

import com.daypoo.api.entity.Favorite;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

  /** 사용자의 전체 즐겨찾기 목록 조회 */
  List<Favorite> findAllByUser(User user);

  /** 특정 유저의 특정 화장실 즐겨찾기 여부 확인 */
  boolean existsByUserAndToilet(User user, Toilet toilet);

  /** 특정 유저의 특정 화장실 즐겨찾기 조회 */
  Optional<Favorite> findByUserAndToilet(User user, Toilet toilet);

  /** 특정 유저의 특정 화장실 즐겨찾기 삭제 */
  void deleteByUserAndToilet(User user, Toilet toilet);

  /** 특정 유저의 모든 즐겨찾기 삭제 (회원 탈퇴용) */
  void deleteAllByUser(User user);

  /** 사용자가 즐겨찾기한 화장실 ID 목록만 조회 */
  @Query("SELECT f.toilet.id FROM Favorite f WHERE f.user = :user")
  List<Long> findToiletIdsByUser(@Param("user") User user);
}
