package com.daypoo.api.repository;

import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.ToiletReview;
import com.daypoo.api.entity.User;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ToiletReviewRepository extends JpaRepository<ToiletReview, Long> {

  boolean existsByUserIdAndToiletId(Long userId, Long toiletId);

  List<ToiletReview> findTop5ByToiletIdOrderByCreatedAtDesc(Long toiletId);

  Page<ToiletReview> findByToiletIdOrderByCreatedAtDesc(Long toiletId, Pageable pageable);

  Page<ToiletReview> findByToiletIdOrderByCreatedAtAsc(Long toiletId, Pageable pageable);

  long countByToiletId(Long toiletId);

  @Query("SELECT AVG(r.rating) FROM ToiletReview r WHERE r.toilet.id = :toiletId")
  Double calculateAvgRatingByToiletId(@Param("toiletId") Long toiletId);

  @Query("SELECT DISTINCT r.toilet FROM ToiletReview r WHERE r.user = :user")
  List<Toilet> findDistinctToiletsByUser(@Param("user") User user);

  void deleteAllByUser(User user);
}
