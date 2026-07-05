package com.daypoo.api.simulation.seeder;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BulkInsertHelper {

  private final JdbcTemplate jdbcTemplate;

  public void bulkInsertUsers(List<Object[]> users) {
    String sql =
        "INSERT INTO users (email, password, nickname, level, exp, points, role, created_at, updated_at) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) "
            + "ON CONFLICT (email) DO NOTHING";
    jdbcTemplate.batchUpdate(sql, users);
  }

  public void bulkInsertPooRecords(List<Object[]> records) {
    String sql =
        "INSERT INTO poo_records (user_id, toilet_id, bristol_scale, color, condition_tags, diet_tags, region_name, created_at) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    jdbcTemplate.batchUpdate(sql, records);
  }

  public void bulkInsertToiletReviews(List<Object[]> reviews) {
    String sql =
        "INSERT INTO toilet_reviews (user_id, toilet_id, rating, emoji_tags, comment, created_at, updated_at) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?)";
    jdbcTemplate.batchUpdate(sql, reviews);
  }

  public void bulkInsertItems(List<Object[]> items) {
    String sql =
        "INSERT INTO items (name, description, type, price, image_url, created_at, updated_at) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?)";
    jdbcTemplate.batchUpdate(sql, items);
  }

  public void bulkInsertTitles(List<Object[]> titles) {
    String sql =
        "INSERT INTO titles (name, description, achievement_type, achievement_threshold, created_at) "
            + "VALUES (?, ?, ?, ?, ?)";
    jdbcTemplate.batchUpdate(sql, titles);
  }

  public void updateToiletStats() {
    String sql =
        "UPDATE toilets t SET "
            + "avg_rating = COALESCE(s.avg_r, 0.0), "
            + "review_count = COALESCE(s.cnt, 0) "
            + "FROM (SELECT toilet_id, AVG(rating) as avg_r, COUNT(*) as cnt FROM toilet_reviews GROUP BY toilet_id) s "
            + "WHERE t.id = s.toilet_id";
    jdbcTemplate.execute(sql);
  }
}
