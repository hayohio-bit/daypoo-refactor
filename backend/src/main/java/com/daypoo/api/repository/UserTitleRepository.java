package com.daypoo.api.repository;

import com.daypoo.api.entity.Title;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.UserTitle;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTitleRepository extends JpaRepository<UserTitle, Long> {
  boolean existsByUserAndTitle(User user, Title title);

  List<UserTitle> findAllByUser(User user);

  void deleteAllByUser(User user);
}
