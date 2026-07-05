package com.daypoo.api.security;

import java.util.Map;

public class KakaoOAuth2UserInfo implements OAuth2UserInfo {

  private final Map<String, Object> attributes;
  private final Map<String, Object> kakaoAccount;

  public KakaoOAuth2UserInfo(Map<String, Object> attributes) {
    this.attributes = attributes;
    this.kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
  }

  @Override
  public String getProviderId() {
    return String.valueOf(attributes.get("id"));
  }

  @Override
  public String getProvider() {
    return "kakao";
  }

  @Override
  public String getEmail() {
    if (kakaoAccount == null) return null;
    return (String) kakaoAccount.get("email");
  }

  @Override
  public String getName() {
    if (kakaoAccount == null) return null;
    Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
    if (profile == null) return null;
    return (String) profile.get("nickname");
  }
}
