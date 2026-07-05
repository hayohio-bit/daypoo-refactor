package com.daypoo.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtProvider {

  private final SecretKey key;
  private final long accessTokenValidity;
  private final long refreshTokenValidity;

  public JwtProvider(
      @Value("${spring.security.jwt.secret-key}") String secretKey,
      @Value("${spring.security.jwt.access-token-validity-in-seconds}") long accessTokenValidity,
      @Value("${spring.security.jwt.refresh-token-validity-in-seconds}")
          long refreshTokenValidity) {
    byte[] keyBytes = Decoders.BASE64.decode(secretKey);
    this.key = Keys.hmacShaKeyFor(keyBytes);
    this.accessTokenValidity = accessTokenValidity * 1000;
    this.refreshTokenValidity = refreshTokenValidity * 1000;
  }

  public String createAccessToken(String email, String role) {
    long now = (new Date()).getTime();
    Date validity = new Date(now + this.accessTokenValidity);

    return Jwts.builder()
        .subject(email)
        .claim("role", role)
        .signWith(key)
        .expiration(validity)
        .compact();
  }

  public String createSseToken(String email, String role) {
    long now = (new Date()).getTime();
    long SSE_TOKEN_VALIDITY = 30 * 1000; // 30초
    Date validity = new Date(now + SSE_TOKEN_VALIDITY);

    return Jwts.builder()
        .subject(email)
        .claim("role", role)
        .claim("type", "sse")
        .signWith(key)
        .expiration(validity)
        .compact();
  }

  public String createRegistrationToken(String email, String role) {
    long now = (new Date()).getTime();
    long FIVE_MINUTES = 5 * 60 * 1000;
    Date validity = new Date(now + FIVE_MINUTES);

    return Jwts.builder()
        .subject(email)
        .claim("email", email)
        .claim("role", role)
        .claim("type", "registration")
        .signWith(key)
        .expiration(validity)
        .compact();
  }

  public String createRefreshToken(String email) {
    long now = (new Date()).getTime();
    Date validity = new Date(now + this.refreshTokenValidity);

    return Jwts.builder().subject(email).signWith(key).expiration(validity).compact();
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  public Claims getClaims(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }

  public long getRemainingTime(String token) {
    Claims claims = getClaims(token);
    Date expiration = claims.getExpiration();
    return Math.max(0, expiration.getTime() - System.currentTimeMillis());
  }
}
