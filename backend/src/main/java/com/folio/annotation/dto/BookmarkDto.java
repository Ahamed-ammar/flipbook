package com.folio.annotation.dto;

import com.folio.annotation.entity.Bookmark;

import java.time.LocalDateTime;

public record BookmarkDto(
        Long id,
        Long bookId,
        String bookTitle,
        Integer pageNumber,
        String label,
        String chapterTitle,
        LocalDateTime createdAt,
        String type
) {
    public static BookmarkDto from(Bookmark b) {
        return new BookmarkDto(
                b.getId(),
                b.getBook().getId(),
                b.getBook().getTitle(),
                b.getPageNumber(),
                b.getLabel(),
                b.getChapterTitle(),
                b.getCreatedAt(),
                "bookmark"
        );
    }
}
