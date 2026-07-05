package com.daypoo.api.mapper;

import com.daypoo.api.dto.ToiletProjection;
import com.daypoo.api.dto.ToiletResponse;
import com.daypoo.api.entity.Toilet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ToiletMapper {

  @Mapping(target = "latitude", expression = "java(toilet.getLocation().getY())")
  @Mapping(target = "longitude", expression = "java(toilet.getLocation().getX())")
  @Mapping(target = "is24h", expression = "java(toilet.is24h())")
  @Mapping(target = "distance", ignore = true)
  ToiletResponse toResponse(Toilet toilet);

  default ToiletResponse toResponse(ToiletProjection projection) {
    if (projection == null) {
      return null;
    }
    return ToiletResponse.builder()
        .id(projection.getId())
        .name(projection.getName())
        .address(projection.getAddress())
        .openHours(projection.getOpenHours())
        .is24h(projection.getIs24h() != null ? projection.getIs24h() : false)
        .latitude(projection.getLatitude())
        .longitude(projection.getLongitude())
        .distance(projection.getDistance())
        .build();
  }
}
