package com.folio.book.dto;

import java.time.LocalDateTime;

public record ProgressDto(
        Integer currentPage,
        Double percentage,
        LocalDateTime lastReadAt
) {}
