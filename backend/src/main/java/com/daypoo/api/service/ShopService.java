package com.daypoo.api.service;

import com.daypoo.api.dto.InventoryResponse;
import com.daypoo.api.dto.ItemResponse;
import com.daypoo.api.dto.TitleResponse;
import com.daypoo.api.entity.*;
import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.*;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ShopService {

  private final ItemRepository itemRepository;
  private final InventoryRepository inventoryRepository;
  private final TitleRepository titleRepository;
  private final UserTitleRepository userTitleRepository;
  private final UserRepository userRepository;

  private final AdminSettingsService adminSettingsService;
  private final TitleAchievementService achievementService;

  /** 상점 아이템 목록 조회 */
  @Transactional(readOnly = true)
  public List<ItemResponse> getAllItems(User user, ItemType type) {
    List<Item> items =
        (type == null)
            ? itemRepository.findAllByPublishedTrue()
            : itemRepository.findAllByTypeAndPublishedTrue(type);

    // 기본 아바타는 상점 목록에서 제외
    Long defaultAvatarItemId = adminSettingsService.getDefaultAvatarItemId();
    if (defaultAvatarItemId != null) {
      items =
          items.stream()
              .filter(item -> !item.getId().equals(defaultAvatarItemId))
              .collect(Collectors.toList());
    }

    // 사용자가 소유한 아이템 ID 목록 조회
    List<Long> ownedItemIds =
        inventoryRepository.findAllByUser(user).stream()
            .map(inv -> inv.getItem().getId())
            .collect(Collectors.toList());

    return items.stream()
        .map(
            item ->
                ItemResponse.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .description(item.getDescription())
                    .type(item.getType())
                    .price(item.getPrice())
                    .discountPrice(item.getDiscountPrice())
                    .imageUrl(item.getImageUrl())
                    .owned(ownedItemIds.contains(item.getId()))
                    .published(item.isPublished())
                    .build())
        .collect(Collectors.toList());
  }

  /** 아이템 구매 */
  @Transactional
  public void purchaseItem(User user, Long itemId) {
    // H3: 동시성 이슈 해결을 위해 비관적 락으로 유저 정보 재조회
    User lockedUser =
        userRepository
            .findByIdForUpdate(user.getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

    Item item =
        itemRepository
            .findById(itemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));

    if (inventoryRepository.existsByUserAndItemId(lockedUser, itemId)) {
      throw new BusinessException(ErrorCode.ALREADY_OWNED_ITEM);
    }

    lockedUser.deductPoints(item.getEffectivePrice());
    userRepository.save(lockedUser);

    try {
      Inventory inventory =
          Inventory.builder().user(lockedUser).item(item).isEquipped(false).build();
      inventoryRepository.save(inventory);
      inventoryRepository.flush(); // 즉시 쿼리 실행하여 유니크 제약 위배 확인
    } catch (org.springframework.dao.DataIntegrityViolationException e) {
      throw new BusinessException(ErrorCode.ALREADY_OWNED_ITEM);
    }
  }

  /** 유저 인벤토리 조회 */
  @Transactional(readOnly = true)
  public List<InventoryResponse> getUserInventory(User user) {
    return inventoryRepository.findAllByUser(user).stream()
        .map(
            inventory ->
                InventoryResponse.builder()
                    .id(inventory.getId())
                    .itemId(inventory.getItem().getId())
                    .itemName(inventory.getItem().getName())
                    .itemType(inventory.getItem().getType().name())
                    .isEquipped(inventory.isEquipped())
                    .imageUrl(inventory.getItem().getImageUrl())
                    .build())
        .collect(Collectors.toList());
  }

  /** 아이템 장착/해제 */
  @Transactional
  public void toggleEquipItem(User user, Long inventoryId) {
    Inventory inventory =
        inventoryRepository
            .findById(inventoryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));

    if (!inventory.getUser().getId().equals(user.getId())) {
      // H6: SecurityException 대신 글로벌 핸들러가 처리 가능한 BusinessException 사용
      throw new BusinessException(ErrorCode.HANDLE_ACCESS_DENIED);
    }

    // 같은 타입의 다른 장착된 아이템이 있다면 해제 (아바타/마커 스킨은 하나만 장착 가능)
    if (!inventory.isEquipped()) {
      List<Inventory> sameTypeItems =
          inventoryRepository.findAllByUserAndIsEquippedTrueAndItemType(
              user, inventory.getItem().getType());
      sameTypeItems.forEach(Inventory::unequip);
      inventory.equip();
    } else {
      inventory.unequip();
    }

    inventoryRepository.save(inventory);
  }

  /** 전체 칭호 목록 및 유저 보유 여부 조회 (업적 동기화 포함) */
  @Transactional(readOnly = true)
  public List<TitleResponse> getAllTitles(User user) {
    // [Manual Acquisition] 업적 검사는 frontend에서 progress 비교로 수행하며,
    // 실제 부여는 acquireTitle 엔드포인트를 통해 명시적으로 수행됨
    List<Title> allTitles = titleRepository.findAll();

    List<Long> ownedTitleIds =
        userTitleRepository.findAllByUser(user).stream()
            .map(ut -> ut.getTitle().getId())
            .collect(Collectors.toList());

    return allTitles.stream()
        .map(
            title -> {
              long progress = achievementService.computeProgress(user, title.getAchievementType());
              String label = getConditionLabel(title);

              return TitleResponse.builder()
                  .id(title.getId())
                  .name(title.getName())
                  .description(title.getDescription())
                  .requirementDescription(label)
                  .isOwned(ownedTitleIds.contains(title.getId()))
                  .isEquipped(
                      user.getEquippedTitleId() != null
                          && user.getEquippedTitleId().equals(title.getId()))
                  .achievementType(title.getAchievementType().name())
                  .achievementThreshold(title.getAchievementThreshold())
                  .currentProgress(progress)
                  .conditionLabel(label)
                  .build();
            })
        .collect(Collectors.toList());
  }

  private String getConditionLabel(Title title) {
    return switch (title.getAchievementType()) {
      case TOTAL_RECORDS -> String.format("총 기록 %d회", title.getAchievementThreshold());
      case UNIQUE_TOILETS -> String.format("화장실 %d곳 방문", title.getAchievementThreshold());
      case CONSECUTIVE_DAYS -> String.format("%d일 연속 기록", title.getAchievementThreshold());
      case SAME_TOILET_VISITS -> String.format("같은 화장실 %d회 방문", title.getAchievementThreshold());
      case LEVEL_REACHED -> String.format("레벨 %d 달성", title.getAchievementThreshold());
    };
  }

  /** 칭호 장착 */
  public void equipTitle(User user, Long titleId) {
    Title title =
        titleRepository
            .findById(titleId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 칭호입니다."));
    if (!userTitleRepository.existsByUserAndTitle(user, title)) {
      throw new IllegalStateException("보유하지 않은 칭호입니다.");
    }
    user.equipTitle(titleId);
    userRepository.save(user);
  }

  /** 칭호 수동 획득 */
  @Transactional
  public void acquireTitle(User user, Long titleId) {
    achievementService.grantTitleSpecific(user, titleId);
  }

  /** 칭호 해제 */
  public void unequipTitle(User user) {
    user.equipTitle(null);
    userRepository.save(user);
  }
}
