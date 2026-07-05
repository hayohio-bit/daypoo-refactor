package com.daypoo.api.dto;

import lombok.Builder;

@Builder
public record SyncStatusResponse(
    String status, // "IDLE", "RUNNING", "COMPLETED", "FAILED"
    Integer totalCount, // 총 처리 건수
    Integer insertedCount, // 신규 등록 건수
    Integer updatedCount, // 업데이트 건수
    String startedAt, // 시작 시각
    String completedAt, // 완료/실패 시각
    String errorMessage // 실패 시 상세 메시지
    ) {}
