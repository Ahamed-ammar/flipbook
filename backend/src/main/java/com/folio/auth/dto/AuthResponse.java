package com.folio.auth.dto;

public record AuthResponse(
    String token,
    UserDto user
) {}
