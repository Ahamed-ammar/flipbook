package com.folio.common;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record ApiError(
    String message,
    int status,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime timestamp
) {
    public static ApiError of(String message, int status) {
        return new ApiError(message, status, LocalDateTime.now());
    }
}
