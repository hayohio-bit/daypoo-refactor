package com.daypoo.api.event;

public record PooRecordCreatedEvent(
    String email, String regionName, int rewardExp, int rewardPoints) {}
