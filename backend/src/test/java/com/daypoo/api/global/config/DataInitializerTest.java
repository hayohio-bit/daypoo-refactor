package com.daypoo.api.global.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.daypoo.api.entity.User;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("DataInitializer 단위 테스트")
class DataInitializerTest {

  @InjectMocks private DataInitializer dataInitializer;

  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;

  private static final String ADMIN_EMAIL = "admin@daypoo.com";

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(dataInitializer, "adminEmail", ADMIN_EMAIL);
  }

  @Test
  @DisplayName("ADMIN_PASSWORD가 비어 있으면 관리자 계정을 생성하지 않는다")
  void run_blankPassword_skipsAdminCreation() {
    ReflectionTestUtils.setField(dataInitializer, "adminPassword", "");
    given(userRepository.findByEmail(ADMIN_EMAIL)).willReturn(Optional.empty());

    dataInitializer.run();

    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("ADMIN_PASSWORD가 설정되어 있으면 관리자 계정을 생성한다")
  void run_withPassword_createsAdmin() {
    ReflectionTestUtils.setField(dataInitializer, "adminPassword", "secret");
    given(userRepository.findByEmail(ADMIN_EMAIL)).willReturn(Optional.empty());
    given(passwordEncoder.encode("secret")).willReturn("encoded-secret");

    dataInitializer.run();

    verify(userRepository).save(any(User.class));
  }

  @Test
  @DisplayName("기존 계정이 관리자 역할이 아니면 비밀번호 설정과 무관하게 역할을 승격한다")
  void run_existingUserWithoutAdminRole_promotesRole() {
    ReflectionTestUtils.setField(dataInitializer, "adminPassword", "");
    User existing = mock(User.class);
    given(existing.getRole()).willReturn(Role.ROLE_USER);
    given(userRepository.findByEmail(ADMIN_EMAIL)).willReturn(Optional.of(existing));

    dataInitializer.run();

    verify(existing).updateRole(Role.ROLE_ADMIN);
    verify(userRepository).save(existing);
  }
}
