package com.daypoo.api.repository;

import com.daypoo.api.entity.Faq;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqRepository extends JpaRepository<Faq, Long> {
  List<Faq> findAllByCategoryOrderByCreatedAtDesc(String category);
}
