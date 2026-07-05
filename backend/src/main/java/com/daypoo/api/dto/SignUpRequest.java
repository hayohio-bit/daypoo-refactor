package com.daypoo.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
    @NotBlank(message = "비밀번호는 필수입니다.") @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
        String password,
    @NotBlank(message = "이메일은 필수입니다.") @Email(message = "이메일 형식이 올바르지 않습니다.") String email,
    @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 12, message = "닉네임은 2자 이상 12자 이하로 입력해주세요.")
        String nickname) {}
