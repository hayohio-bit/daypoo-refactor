package com.daypoo.api.global.filter;

import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.global.exception.ErrorResponse;
import com.daypoo.api.service.AdminSettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaintenanceModeFilter extends OncePerRequestFilter {

  private final AdminSettingsService adminSettingsService;
  private final ObjectMapper objectMapper;

  @Override
  protected void doFilterInternal(
      @lombok.NonNull HttpServletRequest request,
      @lombok.NonNull HttpServletResponse response,
      @lombok.NonNull FilterChain filterChain)
      throws ServletException, IOException {

    // 관리자 관련 API나 스웨거 등은 점검 모드에서도 허용
    String path = request.getRequestURI();
    if (path.startsWith("/api/v1/admin")
        || path.contains("swagger")
        || path.contains("api-docs")
        || path.contains("openapi.yaml")) {
      filterChain.doFilter(request, response);
      return;
    }

    if (adminSettingsService.isMaintenanceMode()) {
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();

      boolean isAdmin =
          auth != null
              && auth.getAuthorities().stream()
                  .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

      if (!isAdmin) {
        log.warn("Maintenance mode is active. Blocking request to: {}", path);
        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType("application/json;charset=UTF-8");

        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.MAINTENANCE_MODE);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
        return;
      }
    }

    filterChain.doFilter(request, response);
  }
}
