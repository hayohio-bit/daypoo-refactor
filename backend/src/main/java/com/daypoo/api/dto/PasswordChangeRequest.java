package com.daypoo.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
    @NotBlank(message = "현재 비밀번호는 필수 입력 항목입니다.") String currentPassword,
    @NotBlank(message = "새 비밀번호는 필수 입력 항목입니다.")
        @Size(min = 4, max = 20, message = "비밀번호는 4자 이상 20자 이하로 입력해주세요.")
        String newPassword) {}
