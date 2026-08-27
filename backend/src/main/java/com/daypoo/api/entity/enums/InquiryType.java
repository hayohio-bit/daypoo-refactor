package com.daypoo.api.entity.enums;

public enum InquiryType {
  HEALTH_ANALYSIS("배변 패턴 분석 오류"),
  OTHERS("기타");

  private final String label;

  InquiryType(String label) {
    this.label = label;
  }

  public String getLabel() {
    return label;
  }

  public static InquiryType fromLabel(String label) {
    for (InquiryType type : values()) {
      if (type.label.equals(label)) {
        return type;
      }
    }
    return OTHERS;
  }
}
