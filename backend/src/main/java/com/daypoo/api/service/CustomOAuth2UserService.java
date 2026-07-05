package com.daypoo.api.service;

import com.daypoo.api.security.GoogleOAuth2UserInfo;
import com.daypoo.api.security.KakaoOAuth2UserInfo;
import com.daypoo.api.security.OAuth2UserInfo;
import java.util.Collections;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);

    String registrationId = userRequest.getClientRegistration().getRegistrationId();
    String userNameAttributeName =
        userRequest
            .getClientRegistration()
            .getProviderDetails()
            .getUserInfoEndpoint()
            .getUserNameAttributeName();

    OAuth2UserInfo oAuth2UserInfo = null;
    if (registrationId.equals("kakao")) {
      oAuth2UserInfo = new KakaoOAuth2UserInfo(oAuth2User.getAttributes());
    } else if (registrationId.equals("google")) {
      oAuth2UserInfo = new GoogleOAuth2UserInfo(oAuth2User.getAttributes());
    } else {
      throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인 제공자입니다.");
    }

    String provider = oAuth2UserInfo.getProvider();
    String providerId = oAuth2UserInfo.getProviderId();
    String email = oAuth2UserInfo.getEmail();

    // 소셜 로그인 회원의 경우 username은 provider_providerId 로 생성
    String username = provider + "_" + providerId;

    // 이메일이 없는 경우
    if (email == null) {
      email = username + "@daypoo.com";
    }

    // 실제 로그인이 완료된 후 SuccessHandler에서 DB 존재 여부를 체크하여
    // 기존 회원이 아니면 프론트엔드의 닉네임 설정 페이지로 리다이렉트합니다.

    return new DefaultOAuth2User(
        Collections.emptyList(), oAuth2User.getAttributes(), userNameAttributeName);
  }
}
