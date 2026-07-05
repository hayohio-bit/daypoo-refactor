package com.daypoo.api.repository;

import com.daypoo.api.entity.Inventory;
import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.ItemType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
  @Query("SELECT i FROM Inventory i JOIN FETCH i.item WHERE i.user = :user")
  List<Inventory> findAllByUser(@Param("user") User user);

  @Query(
      "SELECT i FROM Inventory i JOIN FETCH i.item WHERE i.user = :user AND i.isEquipped = true AND i.item.type = :type")
  List<Inventory> findAllByUserAndIsEquippedTrueAndItemType(
      @Param("user") User user, @Param("type") ItemType type);

  @Query("SELECT i FROM Inventory i JOIN FETCH i.item WHERE i.user = :user AND i.item.id = :itemId")
  Optional<Inventory> findByUserAndItemId(@Param("user") User user, @Param("itemId") Long itemId);

  @Query(
      "SELECT i FROM Inventory i JOIN FETCH i.item WHERE i.user IN :users AND i.isEquipped = true")
  List<Inventory> findEquippedByUserIn(@Param("users") Collection<User> users);

  boolean existsByUserAndItemId(User user, Long itemId);

  boolean existsByItemId(Long itemId);

  void deleteAllByUser(User user);
}
