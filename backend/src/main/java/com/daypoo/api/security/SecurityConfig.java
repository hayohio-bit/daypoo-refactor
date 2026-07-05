package com.daypoo.api.security;

import com.daypoo.api.service.CustomOAuth2UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  @Value("${app.frontend.url}")
  private String frontendUrl;

  @Value("${app.cors.allowed-origins}")
  private List<String> allowedOrigins;

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final com.daypoo.api.global.filter.MaintenanceModeFilter maintenanceModeFilter;
  private final CustomOAuth2UserService customOAuth2UserService;
  private final OAuth2SuccessHandler oAuth2SuccessHandler;
  private final HttpCookieOAuth2AuthorizationRequestRepository
      httpCookieOAuth2AuthorizationRequestRepository;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers("/api/v1/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers(
                        "/api/v1/auth/**",
                        "/api/v1/auth/password/**",
                        "/oauth2/**",
                        "/login/oauth2/**")
                    .permitAll()
                    .requestMatchers("/api/v1/rankings/**")
                    .permitAll()
                    .requestMatchers("/actuator/health")
                    .permitAll()
                    .requestMatchers(
                        "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**", "/openapi.yaml")
                    .permitAll()
                    .requestMatchers("/api/v1/notifications/subscribe")
                    .permitAll()
                    .requestMatchers(
                        HttpMethod.GET,
                        "/api/v1/toilets",
                        "/api/v1/toilets/**",
                        "/api/v1/support/faqs")
                    .permitAll()
                    .requestMatchers("/api/v1/support/inquiries", "/api/v1/support/inquiries/**")
                    .authenticated()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                    new HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)))
        .oauth2Login(
            oauth2 ->
                oauth2
                    .authorizationEndpoint(
                        auth ->
                            auth.authorizationRequestRepository(
                                httpCookieOAuth2AuthorizationRequestRepository))
                    .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                    .successHandler(oAuth2SuccessHandler)
                    .failureHandler(
                        (request, response, exception) -> {
                          log.error("OAuth2 Authentication Failed: {}", exception.getMessage());
                          String encodedMessage =
                              java.net.URLEncoder.encode(
                                  exception.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
                          response.sendRedirect(frontendUrl + "/login?error=" + encodedMessage);
                        }))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(maintenanceModeFilter, JwtAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(allowedOrigins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    config.setAllowedHeaders(
        List.of("Authorization", "Content-Type", "Accept", "X-Correlation-Id"));
    config.setExposedHeaders(List.of("Authorization"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
