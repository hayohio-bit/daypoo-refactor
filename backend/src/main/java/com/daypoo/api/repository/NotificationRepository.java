package com.daypoo.api.repository;

import com.daypoo.api.entity.Notification;
import com.daypoo.api.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  @Query(
      "SELECT n FROM Notification n JOIN FETCH n.user WHERE n.user = :user ORDER BY n.createdAt DESC")
  List<Notification> findAllByUserOrderByCreatedAtDesc(@Param("user") User user);

  long countByUserAndIsReadFalse(User user);

  @Query("SELECT n FROM Notification n JOIN FETCH n.user WHERE n.user = :user AND n.isRead = false")
  List<Notification> findAllByUserAndIsReadFalse(@Param("user") User user);

  void deleteAllByUser(User user);
}
