package com.daypoo.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

  private final JavaMailSender mailSender;
  private final String fromAddress;

  public EmailService(
      JavaMailSender mailSender, @Value("${spring.mail.username}") String fromAddress) {
    this.mailSender = mailSender;
    this.fromAddress = fromAddress;
  }

  /**
   * 이메일 발송 (가상 스레드 또는 비동기 처리가 권장됨)
   *
   * @param to 수신자 이메일 주소
   * @param subject 제목
   * @param text 내용
   */
  @Async
  public void sendEmail(String to, String subject, String text) {
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setTo(to);
      message.setSubject(subject);
      message.setText(text);
      message.setFrom("DayPoo <" + fromAddress + ">");

      mailSender.send(message);
      log.info("📧 Email sent successfully to: {}", to);
    } catch (Exception e) {
      log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
    }
  }
}
