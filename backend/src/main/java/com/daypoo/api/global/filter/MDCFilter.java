package com.daypoo.api.global.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Component
public class MDCFilter implements Filter {

  private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
  private static final String CORRELATION_ID_LOG_VAR_NAME = "correlationId";

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest httpServletRequest = (HttpServletRequest) request;
    String correlationId = httpServletRequest.getHeader(CORRELATION_ID_HEADER);

    if (correlationId == null || correlationId.isEmpty()) {
      correlationId = UUID.randomUUID().toString();
    }

    MDC.put(CORRELATION_ID_LOG_VAR_NAME, correlationId);

    try {
      chain.doFilter(request, response);
    } finally {
      MDC.remove(CORRELATION_ID_LOG_VAR_NAME);
    }
  }
}
