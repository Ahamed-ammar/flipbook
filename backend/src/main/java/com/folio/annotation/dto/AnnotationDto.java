package com.folio.annotation.dto;

import com.folio.annotation.entity.Bookmark;
import com.folio.annotation.entity.Highlight;

import java.time.LocalDateTime;

public record AnnotationDto(
        Long id,
        String type,
        Long bookId,
        String bookTitle,
        Integer pageNumber,
        String selectedText,
        String color,
        String label,
        String chapterTitle,
        LocalDateTime createdAt
) {
    public static AnnotationDto fromHighlight(Highlight h) {
        return new AnnotationDto(
                h.getId(),
                "highlight",
                h.getBook().getId(),
                h.getBook().getTitle(),
                h.getPageNumber(),
                h.getSelectedText(),
                h.getColor(),
                null,
                h.getChapterTitle(),
                h.getCreatedAt()
        );
    }

    public static AnnotationDto fromBookmark(Bookmark b) {
        return new AnnotationDto(
                b.getId(),
                "bookmark",
                b.getBook().getId(),
                b.getBook().getTitle(),
                b.getPageNumber(),
                null,
                null,
                b.getLabel(),
                b.getChapterTitle(),
                b.getCreatedAt()
        );
    }
}
