package com.daypoo.api.repository;

import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.enums.AchievementType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TitleRepository extends JpaRepository<Title, Long> {
  Optional<Title> findByName(String name);

  Page<Title> findAllByAchievementType(AchievementType achievementType, Pageable pageable);

  Page<Title> findByNameContaining(String name, Pageable pageable);

  Page<Title> findByAchievementTypeAndNameContaining(
      AchievementType achievementType, String name, Pageable pageable);

  boolean existsByName(String name);
}
