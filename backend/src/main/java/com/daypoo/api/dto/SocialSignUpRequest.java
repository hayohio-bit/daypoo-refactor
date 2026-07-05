package com.daypoo.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SocialSignUpRequest(
    @NotBlank(message = "가입 토큰은 필수입니다.") String registrationToken,
    @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 10, message = "닉네임은 2자 이상 10자 이하로 입력해주세요.")
        String nickname) {}
