package com.folio.reading.dto;

import com.folio.reading.entity.ReadingProgress;

import java.time.LocalDateTime;

public record ProgressResponse(
        Long bookId,
        Integer currentPage,
        Double progressPercentage,
        LocalDateTime lastReadAt
) {
    public static ProgressResponse from(ReadingProgress p) {
        return new ProgressResponse(
                p.getBook().getId(),
                p.getCurrentPage(),
                p.getProgressPercentage(),
                p.getLastReadAt()
        );
    }
}
