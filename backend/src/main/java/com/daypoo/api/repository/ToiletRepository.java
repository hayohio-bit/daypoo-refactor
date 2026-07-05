package com.daypoo.api.repository;

import com.daypoo.api.dto.ToiletProjection;
import com.daypoo.api.entity.Toilet;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ToiletRepository extends JpaRepository<Toilet, Long> {

  Page<Toilet> findByNameContainingOrAddressContaining(
      String name, String address, Pageable pageable);

  @Query(
      value =
          "SELECT t.id as id, t.name as name, t.address as address, t.open_hours as openHours, t.is_24h as is24h, "
              + "ST_X(t.location) as longitude, ST_Y(t.location) as latitude, "
              + "ST_DistanceSphere(t.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) as distance "
              + "FROM toilets t "
              + "WHERE ST_DistanceSphere(t.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) <= :radius "
              + "ORDER BY distance ASC "
              + "LIMIT :limit",
      nativeQuery = true)
  List<ToiletProjection> findToiletsWithinRadius(
      @Param("latitude") double latitude,
      @Param("longitude") double longitude,
      @Param("radius") double radius,
      @Param("limit") int limit);

  @Query(
      value =
          "SELECT ST_DistanceSphere(t.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) "
              + "FROM toilets t WHERE t.id = :toiletId",
      nativeQuery = true)
  Double getDistanceToToilet(
      @Param("toiletId") Long toiletId,
      @Param("latitude") double latitude,
      @Param("longitude") double longitude);

  @Query("SELECT t.mngNo FROM Toilet t WHERE t.mngNo IN :mngNos")
  List<String> findAllMngNoIn(@Param("mngNos") List<String> mngNos);

  @Query("SELECT t.mngNo FROM Toilet t")
  List<String> findAllMngNos();

  boolean existsByMngNo(String mngNo);

  @Query("SELECT t FROM Toilet t WHERE t.reviewCount >= 5 AND t.aiSummary IS NULL")
  List<Toilet> findToiletsNeedingAiSummary();
}
