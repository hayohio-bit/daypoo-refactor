package com.daypoo.api.repository;

import com.daypoo.api.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT u FROM User u WHERE u.id = :id")
  Optional<User> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

  long countByCreatedAtAfter(LocalDateTime dateTime);

  Optional<User> findByEmail(String email);

  Optional<User> findByNickname(String nickname);

  boolean existsByNickname(String nickname);

  boolean existsByEmail(String email);

  List<User> findAllByOrderByPointsDesc(Pageable pageable);

  @Query("SELECT DISTINCT p.user FROM PooRecord p")
  List<User> findUsersWithRecords();

  long countByRoleIn(List<com.daypoo.api.entity.enums.Role> roles);
}
