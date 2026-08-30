package com.folio.annotation.dto;

import com.folio.annotation.entity.Highlight;

import java.time.LocalDateTime;

public record HighlightDto(
        Long id,
        Long bookId,
        String bookTitle,
        Integer pageNumber,
        String selectedText,
        String color,
        String positionData,
        String chapterTitle,
        LocalDateTime createdAt,
        String type
) {
    public static HighlightDto from(Highlight h) {
        return new HighlightDto(
                h.getId(),
                h.getBook().getId(),
                h.getBook().getTitle(),
                h.getPageNumber(),
                h.getSelectedText(),
                h.getColor(),
                h.getPositionData(),
                h.getChapterTitle(),
                h.getCreatedAt(),
                "highlight"
        );
    }
}
