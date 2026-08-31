package com.folio.common.dto;

public record ErrorResponse(
        String message,
        int status,
        String timestamp
) {}
