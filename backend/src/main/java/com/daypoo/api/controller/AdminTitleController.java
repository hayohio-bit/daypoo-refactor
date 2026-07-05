package com.daypoo.api.controller;

import com.daypoo.api.dto.*;
import com.daypoo.api.entity.enums.AchievementType;
import com.daypoo.api.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin Title Management", description = "관리자 칭호 관리 API")
@RestController
@RequestMapping("/api/v1/admin/titles")
@RequiredArgsConstructor
public class AdminTitleController {

  private final AdminManagementService adminManagementService;

  @Operation(summary = "칭호 목록 조회")
  @GetMapping
  public Page<AdminTitleResponse> getTitles(
      @RequestParam(required = false) AchievementType type,
      @RequestParam(required = false) String search,
      @PageableDefault(size = 20) Pageable pageable) {
    return adminManagementService.getTitles(type, search, pageable);
  }

  @Operation(summary = "칭호 생성")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AdminTitleResponse createTitle(@RequestBody @Valid AdminTitleCreateRequest request) {
    return adminManagementService.createTitle(request);
  }

  @Operation(summary = "칭호 수정")
  @PutMapping("/{id}")
  public AdminTitleResponse updateTitle(
      @PathVariable Long id, @RequestBody @Valid AdminTitleUpdateRequest request) {
    return adminManagementService.updateTitle(id, request);
  }

  @Operation(summary = "칭호 삭제")
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTitle(@PathVariable Long id) {
    adminManagementService.deleteTitle(id);
  }
}
