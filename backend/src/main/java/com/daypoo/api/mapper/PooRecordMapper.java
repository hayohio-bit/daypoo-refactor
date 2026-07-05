package com.daypoo.api.mapper;

import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface PooRecordMapper {

  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "toiletId", source = "toilet.id")
  @Mapping(target = "toiletName", source = "toilet.name")
  @Mapping(target = "conditionTags", source = "conditionTags", qualifiedByName = "stringToList")
  @Mapping(target = "dietTags", source = "dietTags", qualifiedByName = "stringToList")
  @Mapping(target = "warningTags", source = "warningTags", qualifiedByName = "stringToList")
  @Mapping(target = "earnedExp", ignore = true)
  @Mapping(target = "earnedPoints", ignore = true)
  PooRecordResponse toResponse(PooRecord pooRecord);

  @Named("stringToList")
  default List<String> stringToList(String tags) {
    if (tags == null || tags.isBlank()) {
      return Collections.emptyList();
    }
    return Arrays.stream(tags.split(",")).map(String::trim).collect(Collectors.toList());
  }
}
