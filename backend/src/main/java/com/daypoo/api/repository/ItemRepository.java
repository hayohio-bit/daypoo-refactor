package com.daypoo.api.repository;

import com.daypoo.api.entity.Item;
import com.daypoo.api.entity.enums.ItemType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
  List<Item> findAllByType(ItemType type);

  List<Item> findAllByPublishedTrue();

  List<Item> findAllByTypeAndPublishedTrue(ItemType type);
}
