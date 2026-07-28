package com.daypoo.api.global;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Component;

@Component
public class GeometryUtil {

  // SRID 4326 (WGS84)
  private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

  public Point createPoint(double longitude, double latitude) {
    return geometryFactory.createPoint(new Coordinate(longitude, latitude));
  }

  /** 대한민국 위경도 좌표 범위 유효성 검증 (위도 33~39, 경도 124~132) */
  public boolean isValidKoreaCoordinates(double longitude, double latitude) {
    return latitude >= 33.0 && latitude <= 39.0 && longitude >= 124.0 && longitude <= 132.0;
  }
}
