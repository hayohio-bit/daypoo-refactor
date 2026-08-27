package com.daypoo.api.repository;

import com.daypoo.api.entity.Title;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TitleRepository extends JpaRepository<Title, Long> {
  Optional<Title> findByName(String name);
}
