package com.daypoo.api.component;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.repository.UserRepository;
import com.daypoo.api.service.RankingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(2)
@Profile("!production")
@RequiredArgsConstructor
public class RankingDataSeeder implements CommandLineRunner {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final RankingService rankingService;

  @Override
  public void run(String... args) {
    try {
      long userCount = userRepository.count();

      // 유저가 5명 미만인 경우만 테스트 데이터 생성
      if (userCount < 5) {
        log.info("유저 데이터가 부족하여 테스트용 랭킹 데이터를 생성합니다...");

        String[][] mockUsers = {
          {"master_poo@test.com", "쾌변마스터", "15000"},
          {"gold_flush@test.com", "황금변전사", "12500"},
          {"morning_angel@test.com", "아침의천사", "11000"},
          {"happy_gut@test.com", "장행복", "8900"},
          {"fiber_lover@test.com", "식이섬유가좋아", "7200"},
          {"water_drinker@test.com", "물2리터", "6500"},
          {"runner_poo@test.com", "달려라쾌변", "5800"},
          {"steady_poo@test.com", "하루한번꼭", "4200"},
          {"probiotics@test.com", "유산균최고", "3100"},
          {"new_comer@test.com", "초보쾌변러", "1500"},
          {"test_user1@test.com", "변비탈출", "900"},
          {"test_user2@test.com", "화장실탐험가", "500"},
          {"test_user3@test.com", "나도1등할래", "200"}
        };

        String encodedPassword = passwordEncoder.encode("password123!");

        for (String[] mock : mockUsers) {
          if (!userRepository.existsByEmail(mock[0])) {
            User user =
                User.builder()
                    .email(mock[0])
                    .password(encodedPassword)
                    .nickname(mock[1])
                    .role(Role.ROLE_USER)
                    .build();

            // 포인트 부여
            user.addExpAndPoints(Long.parseLong(mock[2]) / 10, Long.parseLong(mock[2]));
            userRepository.save(user);

            // Redis 랭킹에도 즉시 업데이트
            rankingService.updateGlobalRank(user);
          }
        }

        log.info("테스트 데이터 생성 완료! (13명의 유저 추가됨)");
      }
    } catch (Exception e) {
      log.error(
          "❌ RankingDataSeeder failed: {}. Server will continue to start.", e.getMessage(), e);
    }
  }
}
