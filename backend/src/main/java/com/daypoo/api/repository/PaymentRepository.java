package com.daypoo.api.repository;

import com.daypoo.api.entity.Payment;
import com.daypoo.api.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

  @Query("SELECT p FROM Payment p WHERE p.createdAt BETWEEN :start AND :end")
  List<Payment> findAllByCreatedAtBetween(
      @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  @Query("SELECT COUNT(p) FROM Payment p WHERE p.user.id = :userId")
  long countByUserId(@Param("userId") Long userId);

  @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user.id = :userId")
  Long sumAmountByUserId(@Param("userId") Long userId);

  void deleteAllByUser(User user);
}
