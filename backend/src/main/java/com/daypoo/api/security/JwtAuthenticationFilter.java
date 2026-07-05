package com.daypoo.api.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtProvider jwtProvider;
  private final StringRedisTemplate redisTemplate;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    try {
      String token = resolveToken(request);

      // 토큰이 존재할 때만 검증 로직 실행
      if (token != null && jwtProvider.validateToken(token)) {
        // 블랙리스트 확인
        Boolean isBlacklisted = redisTemplate.hasKey("blacklist:" + token);
        if (Boolean.TRUE.equals(isBlacklisted)) {
          // 블랙리스트인 경우 인증 정보를 세팅하지 않고 그냥 다음 필터로 넘김
          filterChain.doFilter(request, response);
          return;
        }

        Claims claims = jwtProvider.getClaims(token);
        String email = claims.getSubject();
        String role = claims.get("role", String.class);

        if (email != null && role != null) {
          Authentication authentication =
              new UsernamePasswordAuthenticationToken(
                  email, null, Collections.singleton(new SimpleGrantedAuthority(role)));
          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      }
    } catch (Exception e) {
      // 💡 핵심: 토큰이 만료되었거나 잘못되었어도 여기서 에러를 터뜨리지 않습니다.
      // 그냥 인증 정보를 세팅하지 않고 다음 필터로 넘겨줍니다.
      // 그러면 permitAll() 경로는 무사히 통과되고, 인증이 필요한 경로는 나중에 시큐리티가 막습니다.
      log.error("Could not set user authentication in security context", e);
    }

    filterChain.doFilter(request, response);
  }

  private String resolveToken(HttpServletRequest request) {
    // 1. Authorization 헤더에서 토큰 추출
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }

    // 2. 쿼리 파라미터에서 토큰 추출 (SSE용: /api/v1/notifications/subscribe 경로만 허용)
    String path = request.getRequestURI();
    if (path != null && path.contains("/notifications/subscribe")) {
      String tokenParam = request.getParameter("token");
      if (!StringUtils.hasText(tokenParam)) {
        tokenParam = request.getParameter("sseToken");
      }
      if (StringUtils.hasText(tokenParam)) {
        return tokenParam;
      }
    }

    return null;
  }
}
